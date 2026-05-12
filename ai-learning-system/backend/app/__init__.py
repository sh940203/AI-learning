from flask import Flask

def create_app():
    app = Flask(__name__)
    
    # 載入設定
    app.config.from_object('app.config.Config')

    # 初始化擴充套件 (例如資料庫)
    # db.init_app(app)

    # 註冊 Blueprints
    # from app.api.auth import auth_bp
    # app.register_blueprint(auth_bp, url_prefix='/api/auth')

    return app
