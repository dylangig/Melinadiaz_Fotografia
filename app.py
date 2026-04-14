from flask import Flask, render_template, request, redirect, url_for, session, flash, Response
import os
import re
import time
import datetime
import unicodedata

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "clave-secreta-melina-2026")

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "melina2026")
BASE_IMAGENES  = os.path.join(app.root_path, 'static', 'imagenes')
DOMINIO        = "https://melinadiazfotografia.com.ar"

categorias = [
    {"nombre": "BOOK INFANTIL", "slug": "infantil", "portada": "portada-infantil.webp"},
    {"nombre": "15 AÑOS",       "slug": "quince",   "portada": "portada-15.webp"},
    {"nombre": "BODAS",         "slug": "bodas",     "portada": "portada-bodas.webp"}
]

NOMBRES_CATEGORIAS = {
    "infantil": "Book Infantil",
    "quince":   "15 Años",
    "bodas":    "Bodas"
}

_trabajos_cache = {"data": None, "ts": 0}

def invalidar_cache():
    _trabajos_cache["data"] = None
    _trabajos_cache["ts"]   = 0

def slugify(texto):
    texto = unicodedata.normalize('NFKD', texto)
    texto = texto.encode('ascii', 'ignore').decode('ascii')
    texto = texto.lower().strip()
    texto = re.sub(r'[^\w\s-]', '', texto)
    texto = re.sub(r'[\s_]+', '-', texto)
    return texto

def comprimir_foto(ruta):
    try:
        from PIL import Image
        with Image.open(ruta) as img:
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.thumbnail((1920, 1920), Image.LANCZOS)
            ext = os.path.splitext(ruta)[1].lower()
            if ext in ('.jpg', '.jpeg'):
                img.save(ruta, 'JPEG', quality=85, optimize=True)
            elif ext == '.webp':
                img.save(ruta, 'WEBP', quality=85)
            elif ext == '.png':
                img.save(ruta, 'PNG', optimize=True)
    except Exception:
        pass

def get_trabajos_data():
    now = time.time()
    if _trabajos_cache["data"] and now - _trabajos_cache["ts"] < 60:
        return _trabajos_cache["data"]

    trabajos = {}
    for cat in categorias:
        slug_cat    = cat["slug"]
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

            descripcion = None
            desc_path   = os.path.join(carpeta_trabajo, "descripcion.txt")
            if os.path.exists(desc_path):
                with open(desc_path, "r", encoding="utf-8") as f:
                    descripcion = f.read().strip()

            descripcion_evento = None
            evento_path        = os.path.join(carpeta_trabajo, "descripcion_evento.txt")
            if os.path.exists(evento_path):
                with open(evento_path, "r", encoding="utf-8") as f:
                    descripcion_evento = f.read().strip()

            trabajos[slug_cat].append({
                "slug":               nombre_trabajo.lower(),
                "nombre":             nombre_trabajo.replace("-", " ").title(),
                "año":                "2026",
                "fotos":              fotos,
                "descripcion":        descripcion,
                "descripcion_evento": descripcion_evento
            })

    _trabajos_cache["data"] = trabajos
    _trabajos_cache["ts"]   = now
    return trabajos


@app.route("/")
def inicio():
    return render_template("inicio.html", categorias=categorias)

@app.route("/galeria/<categoria_slug>")
def ver_categoria(categoria_slug):
    trabajos    = get_trabajos_data().get(categoria_slug, [])
    nombre_cat  = NOMBRES_CATEGORIAS.get(categoria_slug, categoria_slug.capitalize())
    return render_template("categoria.html",
                           categoria=categoria_slug,
                           nombre_categoria=nombre_cat,
                           trabajos=trabajos)

@app.route("/galeria/<categoria>/<trabajo>")
def ver_fotos_trabajo(categoria, trabajo):
    lista        = get_trabajos_data().get(categoria, [])
    trabajo_info = next((t for t in lista if t["slug"] == trabajo.lower()), None)
    if not trabajo_info:
        return render_template("404.html"), 404

    nombre_cat = NOMBRES_CATEGORIAS.get(categoria, categoria.capitalize())

    return render_template("trabajo_detalle.html",
                           categoria=categoria,
                           nombre_categoria=nombre_cat,
                           trabajo=trabajo_info,
                           fotos=trabajo_info["fotos"],
                           descripcion_personalizada=trabajo_info.get("descripcion"),
                           descripcion_evento=trabajo_info.get("descripcion_evento"))

@app.route("/contacto")
def contacto():
    return render_template("contacto.html")

@app.errorhandler(404)
def pagina_no_encontrada(e):
    return render_template("404.html"), 404


@app.route("/sitemap.xml")
def sitemap():
    trabajos_data = get_trabajos_data()
    hoy           = datetime.date.today().isoformat()

    xml  = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    paginas = [
        ("",                  "1.0", "weekly",  hoy),
        ("/contacto",         "0.8", "monthly", hoy),
        ("/galeria/infantil", "0.9", "weekly",  hoy),
        ("/galeria/quince",   "0.9", "weekly",  hoy),
        ("/galeria/bodas",    "0.9", "weekly",  hoy),
    ]
    for path, priority, freq, lastmod in paginas:
        xml += f'''    <url>
        <loc>{DOMINIO}{path}</loc>
        <lastmod>{lastmod}</lastmod>
        <changefreq>{freq}</changefreq>
        <priority>{priority}</priority>
    </url>\n'''

    for categoria, trabajos in trabajos_data.items():
        for t in trabajos:
            carpeta = os.path.join(BASE_IMAGENES, categoria, t["slug"])
            try:
                lastmod = datetime.datetime.fromtimestamp(
                    os.path.getmtime(carpeta)
                ).strftime('%Y-%m-%d')
            except Exception:
                lastmod = hoy
            xml += f'''    <url>
        <loc>{DOMINIO}/galeria/{categoria}/{t["slug"]}</loc>
        <lastmod>{lastmod}</lastmod>
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

    categoria          = request.form["categoria"]
    nombre             = slugify(request.form["nombre"].strip())
    descripcion        = request.form.get("descripcion", "").strip()
    descripcion_evento = request.form.get("descripcion_evento", "").strip()
    fotos              = request.files.getlist("fotos")

    carpeta = os.path.join(BASE_IMAGENES, categoria, nombre)
    os.makedirs(carpeta, exist_ok=True)

    if descripcion:
        with open(os.path.join(carpeta, "descripcion.txt"), "w", encoding="utf-8") as f:
            f.write(descripcion)

    if descripcion_evento:
        with open(os.path.join(carpeta, "descripcion_evento.txt"), "w", encoding="utf-8") as f:
            f.write(descripcion_evento)

    guardadas = 0
    for foto in fotos:
        if foto.filename:
            ruta = os.path.join(carpeta, foto.filename)
            foto.save(ruta)
            comprimir_foto(ruta)
            guardadas += 1

    invalidar_cache()
    flash(f"Trabajo '{nombre}' creado con {guardadas} fotos.")
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

    guardadas = 0
    for foto in fotos:
        if foto.filename:
            ruta = os.path.join(carpeta, foto.filename)
            foto.save(ruta)
            comprimir_foto(ruta)
            guardadas += 1

    invalidar_cache()
    flash(f"{guardadas} fotos agregadas a '{trabajo}'.")
    return redirect(url_for("admin"))

@app.route("/admin/editar-trabajo", methods=["POST"])
def editar_trabajo():
    if not session.get("admin"):
        return redirect(url_for("admin"))

    categoria          = request.form["categoria"]
    trabajo            = request.form["trabajo"]
    descripcion        = request.form.get("descripcion", "").strip()
    descripcion_evento = request.form.get("descripcion_evento", "").strip()

    carpeta = os.path.join(BASE_IMAGENES, categoria, trabajo)

    ruta_desc = os.path.join(carpeta, "descripcion.txt")
    if descripcion:
        with open(ruta_desc, "w", encoding="utf-8") as f:
            f.write(descripcion)
    elif os.path.exists(ruta_desc):
        os.remove(ruta_desc)

    ruta_evento = os.path.join(carpeta, "descripcion_evento.txt")
    if descripcion_evento:
        with open(ruta_evento, "w", encoding="utf-8") as f:
            f.write(descripcion_evento)
    elif os.path.exists(ruta_evento):
        os.remove(ruta_evento)

    invalidar_cache()
    flash(f"Trabajo '{trabajo}' actualizado.")
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

    invalidar_cache()
    return redirect(url_for("admin"))

@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("inicio"))

if __name__ == "__main__":
    app.run(debug=True)