# def servicio_glitter(precio_hora, precio_viatico):
#     print("Stand de Glitter y Maquillaje Artistico")
#     print("Precio por 1 hora: $" + precio_hora)
#     print("Incluye: glitter, gemas, maquillaje artistico, tattoos personalizados")
#     print("Productos hipoalergenicos")
#     print("Viatico: $" + precio_viatico)
# servicio_glitter("38.000", "20.000")

# #return
# def Servicio_glitter_return(precio_hora_return, viatico_return):
#     return{
#         "nombre": "Stand de Glitter",
#         "precio": "Precio: $" + precio_hora_return,
#         "incluye": "glitter, gemas, maquillaje artistico, tattoos personalizados",
#         "productos": "Hipoalergenicos",
#         "viatico": "Precio:" + viatico_return
#     } 

# resultado = Servicio_glitter_return("45.000", "18.000")
# print(resultado["viatico"])

# materiales_glitter = ["glitter en polvo","gemas","maquillaje artistico","tattoos personalizados"]
# print(materiales_glitter[0])
# print(materiales_glitter[2])
# print(len(materiales_glitter))

servicios = [
    {"nombre": "Stand de Glitter", "precio": "$38.000", "Viatico": "$18.000"},
    {"nombre": "Animacion infantil","precio":"$55.500","Viatico": "$25.000"}
]
print(servicios[0]["nombre"])

for servicio in servicios:
    print(f"{servicio["nombre"]} - {servicio["precio"]}")