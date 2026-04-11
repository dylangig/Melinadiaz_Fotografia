from flask import Flask, render_template, request, send_from_directory, redirect, url_for, session, flash, Response
import os

app = Flask(__name__)
app.secret_key = "clave-secreta-melina-2026"

ADMIN_PASSWORD = "melina2026"
BASE_IMAGENES = os.path.join(app.root_path, 'static', 'imagenes')
DOMINIO = "https://melinadiazfotografia.com.ar"

categorias = [
    {"nombre": "BOOK INFANTIL", "slug": "infantil", "portada": "portada-infantil.webp"},
    {"nombre": "15 AÑOS",       "slug": "quince",   "portada": "portada-15.webp"},
    {"nombre": "BODAS",         "slug": "bodas",     "portada": "portada-bodas.webp"}
]

def get_trabajos_data():
    trabajos = {}
    for cat in categorias:
        slug_cat = cat["slug"]
        carpeta_cat = os.path.join(BASE_IMAGENES, slug_cat)
        trabajos[slug_cat] = []
        if not os.path.exists(carpeta_cat):
            continue
        for nombre_trabajo in sorted(os.listdir(carpeta_cat)):
            carpeta_trabajo = os.path.join(carpeta_cat, nombre_trabajo)
            if not os.path.isdir(carpeta_trabajo):
                continue
            fotos = sorted([
                f for f in os.listdir(carpeta_trabajo)
                if f.lower().endswith(('.webp', '.jpg', '.jpeg', '.png'))
            ])
            trabajos[slug_cat].append({
                "slug": nombre_trabajo.lower(),
                "nombre": nombre_trabajo.capitalize(),
                "año": "2026",
                "fotos": fotos
            })
    return trabajos

# ─── RUTAS PRINCIPALES ────────────────────

@app.route("/")
def inicio():
    return render_template("inicio.html", categorias=categorias)

@app.route("/galeria/<categoria_slug>")
def ver_categoria(categoria_slug):
    trabajos = get_trabajos_data().get(categoria_slug, [])
    return render_template("categoria.html", categoria=categoria_slug, trabajos=trabajos)

@app.route("/galeria/<categoria>/<trabajo>")
def ver_fotos_trabajo(categoria, trabajo):
    lista = get_trabajos_data().get(categoria, [])
    trabajo_info = next((t for t in lista if t["slug"] == trabajo.lower()), None)
    if not trabajo_info:
        return render_template("404.html"), 404
    return render_template("trabajo_detalle.html",
                           categoria=categoria,
                           trabajo=trabajo_info,
                           fotos=trabajo_info["fotos"])

@app.route("/contacto")
def contacto():
    return render_template("contacto.html")

@app.errorhandler(404)
def pagina_no_encontrada(e):
    return render_template("404.html"), 404

# ─── SEO ──────────────────

@app.route("/sitemap.xml")
def sitemap():
    trabajos_data = get_trabajos_data()

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    paginas = [
        ("", "1.0",  "weekly"),
        ("/contacto", "0.8", "monthly"),
        ("/galeria/infantil", "0.9", "weekly"),
        ("/galeria/quince",   "0.9", "weekly"),
        ("/galeria/bodas",    "0.9", "weekly"),
    ]
    for path, priority, freq in paginas:
        xml += f'''    <url>
        <loc>{DOMINIO}{path}</loc>
        <changefreq>{freq}</changefreq>
        <priority>{priority}</priority>
    </url>\n'''

    for categoria, trabajos in trabajos_data.items():
        for trabajo in trabajos:
            xml += f'''    <url>
        <loc>{DOMINIO}/galeria/{categoria}/{trabajo["slug"]}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>\n'''

    xml += '</urlset>'
    return Response(xml, mimetype='application/xml')

@app.route("/robots.txt")
def robots():
    txt = f"""User-agent: *
Allow: /
Disallow: /admin

Sitemap: {DOMINIO}/sitemap.xml"""
    return Response(txt, mimetype='text/plain')

# ─── ADMIN ─────────────

@app.route("/admin", methods=["GET", "POST"])
def admin():
    if request.method == "POST" and "password" in request.form:
        if request.form["password"] == ADMIN_PASSWORD:
            session["admin"] = True
        else:
            flash("Contraseña incorrecta")
        return redirect(url_for("admin"))

    if not session.get("admin"):
        return render_template("admin_login.html")

    trabajos_data = get_trabajos_data()
    return render_template("admin.html", categorias=categorias, trabajos_data=trabajos_data)

@app.route("/admin/nuevo-trabajo", methods=["POST"])
def nuevo_trabajo():
    if not session.get("admin"):
        return redirect(url_for("admin"))

    categoria = request.form["categoria"]
    nombre    = request.form["nombre"].strip().lower().replace(" ", "-")
    fotos     = request.files.getlist("fotos")

    carpeta = os.path.join(BASE_IMAGENES, categoria, nombre)
    os.makedirs(carpeta, exist_ok=True)

    for foto in fotos:
        if foto.filename:
            foto.save(os.path.join(carpeta, foto.filename))

    flash(f"Trabajo '{nombre}' creado con {len(fotos)} fotos.")
    return redirect(url_for("admin"))

@app.route("/admin/agregar-fotos", methods=["POST"])
def agregar_fotos():
    if not session.get("admin"):
        return redirect(url_for("admin"))

    categoria = request.form["categoria"]
    trabajo   = request.form["trabajo"]
    fotos     = request.files.getlist("fotos")

    carpeta = os.path.join(BASE_IMAGENES, categoria, trabajo)
    os.makedirs(carpeta, exist_ok=True)

    for foto in fotos:
        if foto.filename:
            foto.save(os.path.join(carpeta, foto.filename))

    flash(f"{len(fotos)} fotos agregadas a '{trabajo}'.")
    return redirect(url_for("admin"))

@app.route("/admin/eliminar-trabajo", methods=["POST"])
def eliminar_trabajo():
    if not session.get("admin"):
        return redirect(url_for("admin"))

    import shutil
    categoria = request.form["categoria"]
    trabajo   = request.form["trabajo"]
    carpeta   = os.path.join(BASE_IMAGENES, categoria, trabajo)

    if os.path.exists(carpeta):
        shutil.rmtree(carpeta)
        flash(f"Trabajo '{trabajo}' eliminado.")
    return redirect(url_for("admin"))

@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("inicio"))

if __name__ == "__main__":
    app.run(debug=True)