from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import action
from .models import Menu, Meal, MealRating, MenuLike, SurveyAnswer, User
from .serializers import (
    MenuSerializer, MealSerializer, UserRegisterSerializer, LoginSerializer
)

# TODO (Diğer modeller ve serializer'lar da eklenecek)

class MenuViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Tüm Menüleri ve tekil bir Menüyü görüntüler.
    Ayrıca menüleri "beğenmek" (like) için bir eylem içerir.
    """
    queryset = Menu.objects.all().order_by('-date')
    serializer_class = MenuSerializer

    # 3. İZİN (PERMISSION) KONTROLÜ (BEST PRACTICE)
    # Varsayılan eylemler (list, retrieve) için herkesin izni olsun (AllowAny),
    # ama 'like' gibi yeni eylemlerimiz için giriş yapmış olma (IsAuthenticated) şartı koyacağız.
    def get_permissions(self):
        if self.action == 'like':
            # 'like' eylemi için giriş yapmış olmak zorunludur
            return [permissions.IsAuthenticated()]
        # Diğer tüm eylemler (listeleme, görme) için izin gerekmez
        return [permissions.AllowAny()]

    # 4. YENİ 'LIKE' EYLEMİ (THE @action BEST PRACTICE)
    # Bu kod, otomatik olarak 'api/menus/1/like/' gibi bir URL oluşturur.
    # 'detail=True' -> Tek bir menü (detayı) üzerinde çalışır (PK gerektirir).
    # 'methods=['post']' -> Bu eylem, sadece POST (veri gönderme) ile çalışır.
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        # pk (primary key) URL'den otomatik olarak gelir (örn: /menus/1/like/)
        menu = self.get_object() # 1 numaralı menü objesini al
        
        # request.user -> Jeton (token) sayesinde kimlik doğrulaması
        # yapılan kullanıcı objesidir. 'IsAuthenticated' sayesinde
        # bu objenin varlığından eminiz.
        user = request.user 

        # 5. MİMARİ KARAR: Bir kullanıcı bir menüyü sadece bir kez beğenebilir.
        # Biz bunu 'MenuLike' modelimizde 'unique_together' ile
        # veritabanı seviyesinde garantilemiştik.
        # Şimdi bunu mantık (logic) seviyesinde de kontrol edelim.
        if MenuLike.objects.filter(user=user, menu=menu).exists():
            # Eğer zaten beğenmişse, hata döndür (400 Bad Request)
            return Response(
                {'detail': 'Bu menüyü zaten beğendiniz.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 6. Beğeniyi oluştur (veritabanına kaydet)
        MenuLike.objects.create(user=user, menu=menu)
        
        # 7. Başarı cevabı döndür (201 Created)
        return Response(
            {'detail': 'Menü başarıyla beğenildi.'},
            status=status.HTTP_201_CREATED
        )

class MealViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Tüm Yemekleri ve tekil bir Yemeği görüntülemek için API endpoint'i.
    """
    queryset = Meal.objects.all()
    serializer_class = MealSerializer

class RegisterView(generics.ListCreateAPIView):
    """
    Yeni kullanıcı kaydı (sadece POST) için API endpoint'i.
    """
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    # Kimlik doğrulaması olmayan (anonim) kullanıcıların
    # bu endpoint'e erişebilmesi için izin veriyoruz.
    permission_classes = [permissions.AllowAny]

class LoginView(generics.GenericAPIView):
    """
    E-posta ve şifre ile giriş yaparak jeton (token) döndürür.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        # Serializer'daki 'validate' metodunu çalıştır
        serializer.is_valid(raise_exception=True)
        
        # 'validate' metodu başarılıysa, 'user' objesini buradan al
        user = serializer.validated_data['user']
        
        # Kullanıcı için bir jeton al veya oluştur
        token, created = Token.objects.get_or_create(user=user)
        
        # Jetonu JSON olarak döndür
        return Response({
            "token": token.key,
            "user_id": user.pk,
            "email": user.email
        }, status=status.HTTP_200_OK)

# TODO BURAYA OYLAMA (MealRating, MenuLike, SurveyAnswer) İÇİN
# ViewSet'LER GELECEK (sonraki adımlarda)