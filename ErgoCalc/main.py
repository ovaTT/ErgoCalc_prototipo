from flask import Flask, render_template, request
from calculadora import calcular

app = Flask(__name__)


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/calculadora")
def abrir_calculadora():
    return render_template("calculadora.html")


@app.route("/calcular", methods=["POST"])
def resultado():
    nomes = [
        "altura_poplitea",
        "altura_cotovelo",
        "altura_joelho",
        "sapato",
        "altura_cadeira",
    ]

    medidas = {}

    try:
        for nome in nomes:
            valor = request.form.get(nome, "").strip()

            if not valor:
                raise ValueError("Preencha todos os campos.")

            medidas[nome] = float(valor.replace(",", "."))

        resultado_calculo = calcular(
            medidas["altura_poplitea"],
            medidas["altura_cotovelo"],
            medidas["altura_joelho"],
            medidas["sapato"],
            medidas["altura_cadeira"],
        )

        if not resultado_calculo["valido"]:
            return render_template(
                "calculadora.html",
                erro=resultado_calculo["mensagem"],
                medidas=medidas,
            )

        return render_template(
            "calculadora.html",
            resultado=resultado_calculo,
            medidas=medidas,
        )

    except ValueError as erro:
        return render_template(
            "calculadora.html",
            erro=str(erro) or "Digite valores numéricos válidos.",
            medidas=request.form,
        )


@app.route("/alertas")
def alertas():
    return render_template("alertas.html")


@app.route("/pausas")
def pausas():
    return render_template("pausas.html")


@app.route("/avaliacao")
def avaliacao():
    return render_template("avaliacao.html")


@app.route("/guia")
def guia():
    return render_template("guia.html")


if __name__ == "__main__":
    app.run(debug=True)