from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token  # Jeton almak için hazır view
from .views import MenuViewSet, MealViewSet, RegisterView

# DRF'in Router'ı, ViewSet'ler için URL'leri OTOMATİK olarak oluşturur.
# Bu, 'api/menus/' ve 'api/menus/<id>/' gibi URL'leri
# bizim elle yazmamızı engeller. (DRY ilkesi!)
router = DefaultRouter()
router.register(r'menus', MenuViewSet, basename='menu')
router.register(r'meals', MealViewSet, basename='meal')

urlpatterns = [
    path('', include(router.urls)),

    # 1. Kayıt (Register) URL'i
    # POST isteği api/register/ adresine geldiğinde RegisterView çalışacak.
    path('register/', RegisterView.as_view(), name='register'),
    
    # 2. Giriş (Login) URL'i
    # POST isteği api/login/ adresine geldiğinde, DRF'in hazır view'i çalışacak
    # ve bize bir "token" (jeton) dönecek.
    path('login/', obtain_auth_token, name='login'),
]