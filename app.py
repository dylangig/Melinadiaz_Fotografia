from flask import Flask, render_template, request, redirect, url_for, session, flash, Response
import os
import re
import io
import time
import datetime
import unicodedata
import boto3
from botocore.client import Config
from PIL import Image

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "clave-secreta-melina-2026")

ADMIN_PASSWORD       = os.environ.get("ADMIN_PASSWORD", "melina2026")
DOMINIO              = "https://melinadiazfotografia.com.ar"
R2_ACCOUNT_ID        = os.environ.get("R2_ACCOUNT_ID", "f05d4a1ce85a4539c5283aca3811f9ea")
R2_ACCESS_KEY_ID     = os.environ.get("R2_ACCESS_KEY_ID", "2b51d72379586c915e2753b11a878c87")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "ef29dbacca24a2636f7c5cdf29d3a35bc3e1638bd9fe8121070125daa71f29c7")
R2_BUCKET_NAME       = os.environ.get("R2_BUCKET_NAME", "fotosmelinaapp")
R2_PUBLIC_URL        = "https://imagenes.melinadiazfotografia.com.ar"

def get_r2():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )

def imagen_url(categoria, trabajo, foto):
    return f"{R2_PUBLIC_URL}/{categoria}/{trabajo}/{foto}"

def portada_url(nombre_archivo):
    return f"{R2_PUBLIC_URL}/{nombre_archivo}"

app.jinja_env.globals["imagen_url"] = imagen_url
app.jinja_env.globals["portada_url"] = portada_url

categorias = [
    {"nombre": "BOOK INFANTIL", "slug": "infantil", "portada": "portada-infantil.webp"},
    {"nombre": "15 AÑOS",       "slug": "quince",   "portada": "portada-15.webp"},
    {"nombre": "BODAS",         "slug": "bodas",    "portada": "portada-bodas.webp"}
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

def comprimir_y_subir(archivo_file, categoria, trabajo, nombre_destino):
    try:
        with Image.open(archivo_file) as img:
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.thumbnail((1920, 1920), Image.LANCZOS)
            buffer = io.BytesIO()
            img.save(buffer, 'WEBP', quality=85, optimize=True)
            buffer.seek(0)
            base = os.path.splitext(nombre_destino)[0]
            key  = f"{categoria}/{trabajo}/{base}.webp"
            get_r2().put_object(
                Bucket=R2_BUCKET_NAME,
                Key=key,
                Body=buffer,
                ContentType="image/webp",
            )
            return f"{base}.webp"
    except Exception as e:
        app.logger.error(f"Error subiendo imagen a R2: {e}")
        return None

def subir_texto(categoria, trabajo, nombre_archivo, contenido):
    key = f"{categoria}/{trabajo}/{nombre_archivo}"
    get_r2().put_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
        Body=contenido.encode("utf-8"),
        ContentType="text/plain; charset=utf-8",
    )

def leer_texto_r2(categoria, trabajo, nombre_archivo):
    key = f"{categoria}/{trabajo}/{nombre_archivo}"
    try:
        resp = get_r2().get_object(Bucket=R2_BUCKET_NAME, Key=key)
        return resp["Body"].read().decode("utf-8").strip()
    except Exception:
        return None

def eliminar_objeto_r2(key):
    try:
        get_r2().delete_object(Bucket=R2_BUCKET_NAME, Key=key)
    except Exception as e:
        app.logger.error(f"Error eliminando {key} de R2: {e}")

def listar_objetos_r2(prefijo):
    keys   = []
    kwargs = {"Bucket": R2_BUCKET_NAME, "Prefix": prefijo}
    while True:
        resp = get_r2().list_objects_v2(**kwargs)
        for obj in resp.get("Contents", []):
            keys.append(obj["Key"])
        if resp.get("IsTruncated"):
            kwargs["ContinuationToken"] = resp["NextContinuationToken"]
        else:
            break
    return keys

def get_trabajos_data():
    now = time.time()
    if _trabajos_cache["data"] and now - _trabajos_cache["ts"] < 60:
        return _trabajos_cache["data"]

    s3       = get_r2()
    trabajos = {}

    for cat in categorias:
        slug_cat           = cat["slug"]
        trabajos[slug_cat] = {}
        prefijo            = f"{slug_cat}/"
        kwargs             = {"Bucket": R2_BUCKET_NAME, "Prefix": prefijo, "Delimiter": "/"}

        resp        = s3.list_objects_v2(**kwargs)
        subcarpetas = [cp["Prefix"] for cp in resp.get("CommonPrefixes", [])]

        while resp.get("IsTruncated"):
            resp        = s3.list_objects_v2(**kwargs, ContinuationToken=resp["NextContinuationToken"])
            subcarpetas += [cp["Prefix"] for cp in resp.get("CommonPrefixes", [])]

        for subcarpeta in sorted(subcarpetas):
            nombre_trabajo     = subcarpeta.rstrip("/").split("/")[-1]
            objetos            = listar_objetos_r2(subcarpeta)
            fotos              = sorted([
                os.path.basename(k) for k in objetos
                if k.lower().endswith(('.webp', '.jpg', '.jpeg', '.png'))
            ])
            descripcion        = leer_texto_r2(slug_cat, nombre_trabajo, "descripcion.txt")
            descripcion_evento = leer_texto_r2(slug_cat, nombre_trabajo, "descripcion_evento.txt")

            trabajos[slug_cat][nombre_trabajo] = {
                "slug":               nombre_trabajo.lower(),
                "nombre":             nombre_trabajo.replace("-", " ").title(),
                "año":                "2026",
                "fotos":              fotos,
                "descripcion":        descripcion,
                "descripcion_evento": descripcion_evento,
            }

        trabajos[slug_cat] = list(trabajos[slug_cat].values())

    _trabajos_cache["data"] = trabajos
    _trabajos_cache["ts"]   = now
    return trabajos


@app.route("/")
def inicio():
    return render_template("inicio.html", categorias=categorias)

@app.route("/galeria/<categoria_slug>")
def ver_categoria(categoria_slug):
    trabajos   = get_trabajos_data().get(categoria_slug, [])
    nombre_cat = NOMBRES_CATEGORIAS.get(categoria_slug, categoria_slug.capitalize())
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
            xml += f'''    <url>
        <loc>{DOMINIO}/galeria/{categoria}/{t["slug"]}</loc>
        <lastmod>{hoy}</lastmod>
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
    if descripcion:
        subir_texto(categoria, nombre, "descripcion.txt", descripcion)
    if descripcion_evento:
        subir_texto(categoria, nombre, "descripcion_evento.txt", descripcion_evento)
    guardadas = 0
    for foto in fotos:
        if foto.filename:
            if comprimir_y_subir(foto, categoria, nombre, foto.filename):
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
    guardadas = 0
    for foto in fotos:
        if foto.filename:
            if comprimir_y_subir(foto, categoria, trabajo, foto.filename):
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
    if descripcion:
        subir_texto(categoria, trabajo, "descripcion.txt", descripcion)
    else:
        eliminar_objeto_r2(f"{categoria}/{trabajo}/descripcion.txt")
    if descripcion_evento:
        subir_texto(categoria, trabajo, "descripcion_evento.txt", descripcion_evento)
    else:
        eliminar_objeto_r2(f"{categoria}/{trabajo}/descripcion_evento.txt")
    invalidar_cache()
    flash(f"Trabajo '{trabajo}' actualizado.")
    return redirect(url_for("admin"))

@app.route("/admin/eliminar-trabajo", methods=["POST"])
def eliminar_trabajo():
    if not session.get("admin"):
        return redirect(url_for("admin"))
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
        flash(f"Trabajo '{trabajo}' eliminado.")
    else:
        flash(f"No se encontraron archivos para '{trabajo}'.")
    invalidar_cache()
    return redirect(url_for("admin"))

@app.route("/admin/eliminar-foto", methods=["POST"])
def eliminar_foto():
    if not session.get("admin"):
        return redirect(url_for("admin"))
    categoria = request.form["categoria"]
    trabajo   = request.form["trabajo"]
    foto      = request.form["foto"]
    key       = f"{categoria}/{trabajo}/{foto}"
    try:
        get_r2().head_object(Bucket=R2_BUCKET_NAME, Key=key)
        eliminar_objeto_r2(key)
        flash(f"Foto '{foto}' eliminada.")
        invalidar_cache()
    except Exception:
        flash("La foto no existe en R2.")
    return redirect(url_for("admin"))

@app.route("/admin/reordenar-fotos", methods=["POST"])
def reordenar_fotos():
    if not session.get("admin"):
        return redirect(url_for("admin"))
    categoria = request.form["categoria"]
    trabajo   = request.form["trabajo"]
    orden     = request.form.getlist("orden[]")
    s3        = get_r2()
    temp_keys = []
    for idx, nombre in enumerate(orden):
        src_key  = f"{categoria}/{trabajo}/{nombre}"
        temp_key = f"{categoria}/{trabajo}/_temp_{idx}.webp"
        try:
            s3.copy_object(
                Bucket=R2_BUCKET_NAME,
                CopySource={"Bucket": R2_BUCKET_NAME, "Key": src_key},
                Key=temp_key,
            )
            temp_keys.append(temp_key)
            eliminar_objeto_r2(src_key)
        except Exception as e:
            app.logger.error(f"Error copiando {src_key}: {e}")
    for idx, temp_key in enumerate(temp_keys):
        new_key = f"{categoria}/{trabajo}/{idx+1}.webp"
        try:
            s3.copy_object(
                Bucket=R2_BUCKET_NAME,
                CopySource={"Bucket": R2_BUCKET_NAME, "Key": temp_key},
                Key=new_key,
            )
            eliminar_objeto_r2(temp_key)
        except Exception as e:
            app.logger.error(f"Error renombrando {temp_key}: {e}")
    invalidar_cache()
    flash("Fotos reordenadas correctamente.")
    return redirect(url_for("admin"))

@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("inicio"))

if __name__ == "__main__":
    app.run(debug=True)