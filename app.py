from flask import Flask, render_template, request

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

fotos = ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp", "6.webp", "7.webp","8.webp","9.webp"]

@app.route("/contacto")
def contacto():
    return render_template("contacto.html")

@app.route("/")
def inicio():
    return render_template("inicio.html", fotos=fotos )

@app.route("/servicios")
def mostrar_servicios():
    return render_template("servicios.html", servicios=servicios)
if __name__ == "__main__":
    app.run(debug=True)

