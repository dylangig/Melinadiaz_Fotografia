# ══════════════════════════════════════════════════════════════════════════════
# AGREGAR AL app.py EXISTENTE
# Estos son los endpoints JSON que el frontend React va a consumir.
# También hay que instalar flask-cors: pip install flask-cors
# Y agregar al inicio del app.py:
#   from flask_cors import CORS
#   CORS(app, origins=["http://localhost:5173", "https://tudominio.com"], supports_credentials=True)
# ══════════════════════════════════════════════════════════════════════════════

from flask import jsonify

# ── /api/categorias ────────────────────────────────────────────────────────
@app.route("/api/categorias")
def api_categorias():
    return jsonify(categorias)


# ── /api/trabajos/<categoria> ──────────────────────────────────────────────
@app.route("/api/trabajos/<categoria_slug>")
def api_trabajos(categoria_slug):
    trabajos = get_trabajos_data().get(categoria_slug, [])
    return jsonify(trabajos)


# ── /api/trabajos/<categoria>/<trabajo> ────────────────────────────────────
@app.route("/api/trabajos/<categoria>/<trabajo>")
def api_trabajo_detalle(categoria, trabajo):
    lista = get_trabajos_data().get(categoria, [])
    t = next((t for t in lista if t["slug"] == trabajo.lower()), None)
    if not t:
        return jsonify({"error": "No encontrado"}), 404
    return jsonify(t)


# ── /api/trabajos-todos (para el admin) ────────────────────────────────────
@app.route("/api/trabajos-todos")
def api_trabajos_todos():
    if not session.get("admin"):
        return jsonify({"error": "No autorizado"}), 401
    return jsonify(get_trabajos_data())


# ── /api/servicios ─────────────────────────────────────────────────────────
@app.route("/api/servicios")
def api_servicios():
    return jsonify(servicios)


# ── /api/admin/check ──────────────────────────────────────────────────────
@app.route("/api/admin/check")
def api_admin_check():
    if session.get("admin"):
        return jsonify({"ok": True})
    return jsonify({"ok": False}), 401


# ── /api/admin/login ──────────────────────────────────────────────────────
@app.route("/api/admin/login", methods=["POST"])
def api_admin_login():
    data = request.get_json()
    if data and data.get("password") == ADMIN_PASSWORD:
        session["admin"] = True
        return jsonify({"ok": True})
    return jsonify({"error": "Contraseña incorrecta"}), 401


# ── /api/admin/logout ─────────────────────────────────────────────────────
@app.route("/api/admin/logout")
def api_admin_logout():
    session.pop("admin", None)
    return jsonify({"ok": True})


# ── /api/admin/nuevo-trabajo ──────────────────────────────────────────────
@app.route("/api/admin/nuevo-trabajo", methods=["POST"])
def api_nuevo_trabajo():
    if not session.get("admin"):
        return jsonify({"error": "No autorizado"}), 401
    categoria          = request.form["categoria"]
    nombre             = slugify(request.form["nombre"].strip())
    descripcion        = request.form.get("descripcion", "").strip()
    descripcion_evento = request.form.get("descripcion_evento", "").strip()
    fotos              = request.files.getlist("fotos")
    if descripcion:
        subir_texto(categoria, nombre, "descripcion.txt", descripcion)
    if descripcion_evento:
        subir_texto(categoria, nombre, "descripcion_evento.txt", descripcion_evento)
    guardadas = sum(
        1 for f in fotos
        if f.filename and comprimir_y_subir(f, categoria, nombre, f.filename)
    )
    invalidar_cache()
    return jsonify({"mensaje": f"Trabajo '{nombre}' creado con {guardadas} fotos."})


# ── /api/admin/agregar-fotos ──────────────────────────────────────────────
@app.route("/api/admin/agregar-fotos", methods=["POST"])
def api_agregar_fotos():
    if not session.get("admin"):
        return jsonify({"error": "No autorizado"}), 401
    categoria = request.form["categoria"]
    trabajo   = request.form["trabajo"]
    fotos     = request.files.getlist("fotos")
    guardadas = sum(
        1 for f in fotos
        if f.filename and comprimir_y_subir(f, categoria, trabajo, f.filename)
    )
    invalidar_cache()
    return jsonify({"mensaje": f"{guardadas} fotos agregadas a '{trabajo}'."})


# ── /api/admin/eliminar-trabajo ───────────────────────────────────────────
@app.route("/api/admin/eliminar-trabajo", methods=["POST"])
def api_eliminar_trabajo():
    if not session.get("admin"):
        return jsonify({"error": "No autorizado"}), 401
    categoria = request.form["categoria"]
    trabajo   = request.form["trabajo"]
    keys      = listar_objetos_r2(f"{categoria}/{trabajo}/")
    if keys:
        s3 = get_r2()
        for i in range(0, len(keys), 1000):
            s3.delete_objects(
                Bucket=R2_BUCKET_NAME,
                Delete={"Objects": [{"Key": k} for k in keys[i:i+1000]]}
            )
        invalidar_cache()
        return jsonify({"mensaje": f"Trabajo '{trabajo}' eliminado."})
    return jsonify({"mensaje": f"No se encontraron archivos para '{trabajo}'."})


# ── /api/admin/eliminar-foto ──────────────────────────────────────────────
@app.route("/api/admin/eliminar-foto", methods=["POST"])
def api_eliminar_foto():
    if not session.get("admin"):
        return jsonify({"error": "No autorizado"}), 401
    categoria = request.form["categoria"]
    trabajo   = request.form["trabajo"]
    foto      = request.form["foto"]
    key       = f"{categoria}/{trabajo}/{foto}"
    try:
        get_r2().head_object(Bucket=R2_BUCKET_NAME, Key=key)
        eliminar_objeto_r2(key)
        invalidar_cache()
        return jsonify({"mensaje": f"Foto '{foto}' eliminada."})
    except Exception:
        return jsonify({"error": "La foto no existe en R2."}), 404
