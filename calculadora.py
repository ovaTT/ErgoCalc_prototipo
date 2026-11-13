import math


def validar_medidas(
    altura_poplitea,
    altura_cotovelo,
    altura_joelho,
    sapato,
    altura_cadeira,
):
    medidas = [
        altura_poplitea,
        altura_cotovelo,
        altura_joelho,
        sapato,
        altura_cadeira,
    ]

    if not all(math.isfinite(valor) for valor in medidas):
        return False

    if (
        altura_poplitea <= 0
        or altura_cotovelo <= 0
        or altura_joelho <= 0
        or sapato < 0
        or altura_cadeira <= 0
    ):
        return False

    return True


def calcular(
    altura_poplitea,
    altura_cotovelo,
    altura_joelho,
    sapato,
    altura_cadeira,
):
    if not validar_medidas(
        altura_poplitea,
        altura_cotovelo,
        altura_joelho,
        sapato,
        altura_cadeira,
    ):
        return {
            "valido": False,
            "mensagem": (
                "Medidas inválidas. Informe valores positivos "
                "e uma sola igual ou maior que zero."
            ),
        }

    # Fórmula original do projeto, mantida provisoriamente.
    altura_base = altura_poplitea + sapato

    altura_minima = altura_base * math.cos(math.radians(30))
    altura_maxima = altura_base * math.cos(math.radians(5))
    altura_media = (altura_minima + altura_maxima) / 2

    if altura_cadeira < altura_minima:
        diferenca = altura_minima - altura_cadeira
        avaliacao = (
            f"A cadeira está abaixo da faixa calculada "
            f"em {diferenca:.2f} cm."
        )
    elif altura_cadeira > altura_maxima:
        diferenca = altura_cadeira - altura_maxima
        avaliacao = (
            f"A cadeira está acima da faixa calculada "
            f"em {diferenca:.2f} cm."
        )
    else:
        avaliacao = (
            "A altura da cadeira está dentro da faixa calculada."
        )

    return {
        "valido": True,
        "mensagem": "Cálculo realizado com sucesso.",
        "altura_poplitea": altura_poplitea,
        "altura_cotovelo": altura_cotovelo,
        "altura_joelho": altura_joelho,
        "sapato": sapato,
        "altura_cadeira": altura_cadeira,
        "altura_minima": altura_minima,
        "altura_maxima": altura_maxima,
        "altura_media": altura_media,
        "avaliacao": avaliacao,
    }