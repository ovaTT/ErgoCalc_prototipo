
import math


def validar_medidas(altura_poplitea, altura_cotovelo, altura_joelho, sapato, altura_cadeira):
    if (
        altura_poplitea <= 0
        or altura_cotovelo <= 0
        or altura_joelho <= 0
        or sapato < 0
        or altura_cadeira <= 0
    ):
        return False

    return True


def calcular(altura_poplitea, altura_cotovelo, altura_joelho, sapato, altura_cadeira):
    if not validar_medidas(
        altura_poplitea,
        altura_cotovelo,
        altura_joelho,
        sapato,
        altura_cadeira
    ):
        return None

    altura_minima = (altura_poplitea + sapato) * math.cos(math.radians(30))
    altura_maxima = (altura_poplitea + sapato) * math.cos(math.radians(5))
    altura_media = (altura_minima + altura_maxima) / 2

    if altura_cadeira < altura_minima:
        avaliacao = "A cadeira está muito baixa."
    elif altura_cadeira > altura_maxima:
        avaliacao = "A cadeira está muito alta."
    else:
        avaliacao = "A altura da cadeira está dentro do intervalo calculado."

    return {
        "avaliacao": avaliacao,
        "altura_minima": altura_minima,
        "altura_maxima": altura_maxima,
        "altura_media": altura_media
    }


print("===================================")
print("             ERGOCALC")
print(" Calculadora de altura da cadeira")
print("===================================\n")

try:
    altura_poplitea = float(input("Altura poplítea (cm): "))
    altura_cotovelo = float(input("Altura do cotovelo (cm): "))
    altura_joelho = float(input("Altura do joelho (cm): "))
    sapato = float(input("Espessura do solado (cm): "))
    altura_cadeira = float(input("Altura atual da cadeira (cm): "))

    resultado = calcular(
        altura_poplitea,
        altura_cotovelo,
        altura_joelho,
        sapato,
        altura_cadeira
    )

    if resultado is None:
        print("\nErro: as medidas informadas são inválidas.")
    else:
        print("\n========== RESULTADO ==========")
        print(resultado["avaliacao"])
        print(f"Altura mínima: {resultado['altura_minima']:.2f} cm")
        print(f"Altura máxima: {resultado['altura_maxima']:.2f} cm")
        print(f"Altura média:  {resultado['altura_media']:.2f} cm")
        print("===============================")

except ValueError:
    print("\nErro: digite apenas números válidos.")

input("\nPressione Enter para encerrar...")
