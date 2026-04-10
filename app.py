from flask import Flask, render_template, request, send_from_directory
import os

app = Flask(__name__)

servicios = [
    {
        "nombre": "Bodas",
        "descripcion": "Nuestro Stand de Glitter ofrece una experiencia completa de brillo y color...",
        "fotos": ["Glitter1.webp", "Glitter2.webp", "Glitter3.webp"]
    },
    {
        "nombre": "XV",
        "descripcion": "Incluye juegos de destreza, habilidad y competencia...",
        "fotos": ["Animacion1.webp", "Animacion2.webp"]
    },
    {
        "nombre": "BOOK INFANTIL",
        "descripcion": "Fotos ilimitadas, todas editadas en alta calidad...",
        "fotos": ["fotografia1.webp", "fotografia2.webp"]
    }
]

categorias = [
    {"nombre": "BOOK INFANTIL", "slug": "infantil", "portada": "portada-infantil.webp"},
    {"nombre": "15 AÑOS", "slug": "quince", "portada": "portada-15.webp"},
    {"nombre": "BODAS", "slug": "bodas", "portada": "portada-bodas.webp"}
]

TRABAJOS_DATA = {
    "infantil": [
        {
            "slug": "jose", 
            "nombre": "Jose", 
            "año": "2026", 
            "fotos": ["1.webp", "2.webp", "3.webp","4.webp","5.webp","6.webp","7.webp","8.webp","9.webp","10.webp", "11.webp","12.webp","13.webp","14.webp"]
        }, 
        {"slug": "vicky", "nombre": "Vicky", "año": "2024", "fotos": ["vicky1.webp", "vicky2.webp"]}
    ],
    "quince": [
        {"slug": "martina", "nombre": "Martina", "año": "2023", "fotos": ["1.webp", "2.webp"]}
    ],
    "bodas": []
}

@app.route('/static/imagenes/<path:filename>')
def custom_static(filename):
    # Esto fuerza a Flask a entregar la imagen si Vercel la bloquea
    return send_from_directory(os.path.join(app.root_path, 'static', 'imagenes'), filename)

@app.route("/")
def inicio():
    return render_template("inicio.html", categorias=categorias)

@app.route("/galeria/<categoria_slug>")
def ver_categoria(categoria_slug):
    trabajos = TRABAJOS_DATA.get(categoria_slug, [])
    return render_template("categoria.html", categoria=categoria_slug, trabajos=trabajos)

@app.route("/servicios")
def mostrar_servicios():
    return render_template("servicios.html", servicios=servicios)

@app.route("/contacto")
def contacto():
    return render_template("contacto.html")

@app.route("/galeria/<categoria>/<trabajo>")
def ver_fotos_trabajo(categoria, trabajo):
    lista_trabajos = TRABAJOS_DATA.get(categoria, [])
    # Buscamos el diccionario del trabajo por su slug
    trabajo_info = next((t for t in lista_trabajos if t["slug"] == trabajo), None)

    if not trabajo_info:
        return "Trabajo no encontrado", 404
    
    return render_template("trabajo_detalle.html", 
                           categoria=categoria, 
                           trabajo=trabajo_info, 
                           fotos=trabajo_info["fotos"])

if __name__ == "__main__":
    app.run(debug=True)