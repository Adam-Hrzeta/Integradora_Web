from flask import Flask, render_template, redirect, url_for, jsonify
import requests
import json

app = Flask(__name__)

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/profile')
def profile():
    return render_template('profileAdmin.html')

@app.route('/manageUsers')
def manageUsers():
    return render_template('manageUsers.html')

@app.route('/messages')
def messages():
    return render_template('messages.html')

@app.route('/mobile/messages')
def mobile_messages():
    return render_template('mobile/messages.html')

@app.route('/api/check-firebase')
def check_firebase():
    """Comprueba la conexión con Firebase Realtime Database"""
    try:
        # URL para verificar Firebase RTDB
        rtdb_url = "https://parkingtech-99936-default-rtdb.firebaseio.com/system/test.json"
        # Realizar una solicitud GET para verificar la conexión
        response = requests.get(rtdb_url)
        status = response.status_code == 200
        
        # Si la solicitud es exitosa pero no hay datos, intentar crear un test
        if status and not response.json():
            # Enviar datos de prueba
            test_data = {"timestamp": "test", "status": "ok"}
            post_response = requests.put(rtdb_url, data=json.dumps(test_data))
            if post_response.status_code != 200:
                status = False
                
        return jsonify({
            "connected": status,
            "message": "Conexión exitosa con Firebase" if status else "Error de conexión con Firebase",
            "status_code": response.status_code
        })
    except Exception as e:
        return jsonify({
            "connected": False,
            "message": f"Error al verificar Firebase: {str(e)}",
            "error": str(e)
        })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')