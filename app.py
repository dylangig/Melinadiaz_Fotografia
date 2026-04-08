from flask import Flask, render_template, request
import os

app = Flask(__name__)

servicios = [
    {
        "nombre": "Stand de Glitter y Maquillaje Artístico",
        "descripcion": "Nuestro Stand de Glitter ofrece una experiencia completa de brillo y color con glitter en polvo o gel, gemas, strass, piedras y polvo de hadas en variados colores, texturas y tamaños. Incluye pelos locos con pintura de brillo, maquillaje artístico para niños y adultos, y tatuajes personalizados. Todos nuestros productos son hipoalergénicos y el servicio viene equipado con banner, cartel y espejo hollywood.",
        "fotos": ["Glitter1.webp", "Glitter2.webp", "Glitter3.webp"]
    },
    {
        "nombre": "Animación Infantil",
        "descripcion": "Incluye juegos de destreza, habilidad y competencia acorde a la edad del grupo, maquillaje artístico para todos los nenes, también glitter y máquina de burbujas. Te ayudamos a organizar el momento de la torta y piñata, también a servirle a los nenes la comida y gaseosa. Incluye disfraz de panchero.",
        "fotos": ["Animacion1.webp", "Animacion2.webp"]
    },
    {
        "nombre": "Fotografía Profesional",
        "descripcion": "Fotos ilimitadas, todas editadas en alta calidad y entregadas en formato digital por Google Drive.de cancelación.",
        "fotos": ["fotografia1.webp", "fotografia2.webp"]
    }
    ]

# Definimos las categorías basándonos en tus carpetas de static/imagenes/
categorias = [
    {"nombre": "BOOK INFANTIL", "slug": "infantil", "portada": "portada-infantil.webp"},
    {"nombre": "15 AÑOS", "slug": "quince", "portada": "portada-15.webp"},
    {"nombre": "BODAS", "slug": "bodas", "portada": "portada-bodas.webp"}
]

@app.route("/")
def inicio():
    # Ahora pasamos las categorías a inicio.html en lugar de la lista de fotos plana
    return render_template("inicio.html", categorias=categorias)

@app.route("/galeria/<categoria_slug>")
def ver_categoria(categoria_slug):
    # Ruta física a la carpeta: static/imagenes/infantil, etc.
    ruta_categoria = os.path.join('static', 'imagenes', categoria_slug)
    
    # Buscamos subcarpetas (ej: victoria, jose) dentro de la categoría
    if os.path.exists(ruta_categoria):
        # Filtramos para obtener solo nombres de carpetas
        trabajos = [f for f in os.listdir(ruta_categoria) if os.path.isdir(os.path.join(ruta_categoria, f))]
    else:
        trabajos = []
        
    return render_template("categoria.html", categoria=categoria_slug, trabajos=trabajos)

@app.route("/servicios")
def mostrar_servicios():
    return render_template("servicios.html", servicios=servicios)

@app.route("/contacto")
def contacto():
    return render_template("contacto.html")

if __name__ == "__main__":
    app.run(debug=True)

