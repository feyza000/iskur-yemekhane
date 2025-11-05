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
    
    @action(detail=True, methods=['post'])
    def submit_survey(self, request, pk=None):
        """
        Bir menü için 3 soruluk anketi kaydeder veya günceller.
        URL: /api/menus/1/submit_survey/
        """
        menu = self.get_object() # Hangi menü olduğunu URL'den (pk) al
        user = request.user      # Kimin yolladığını jetondan (token) al

        # Gelen JSON verisini ({"q_portion": 4, ...}) al
        data = request.data
        
        # update_or_create
        # Django'ya diyoruz ki: "Bu 'user' ve 'menu' için bir kayıt ara."
        # "Eğer bulursan, 'defaults' içindeki verilerle GÜNCELLE."
        # "Eğer bulamazsan, 'defaults' içindeki verilerle YENİ OLUŞTUR."
        # Bu, kullanıcının anket cevabını değiştirebilmesini sağlar.
        survey_answer, created = SurveyAnswer.objects.update_or_create(
            user=user, 
            menu=menu,
            defaults={
                'q_portion': data.get('q_portion'),
                'q_taste': data.get('q_taste'),
                'q_cleanliness': data.get('q_cleanliness')
            }
        )

        # Tercümanı kullanarak cevabı temiz bir JSON olarak döndür
        serializer = SurveyAnswerSerializer(survey_answer)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        
        return Response(serializer.data, status=status_code)

class MealViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Tüm Yemekleri ve tekil bir Yemeği görüntülemek için API endpoint'i.
    """
    queryset = Meal.objects.all()
    serializer_class = MealSerializer

    def get_permissions(self):
        if self.action == 'rate':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """
        Bir yemeğe 1-5 arası puan verir veya puanı günceller.
        URL: /api/meals/1/rate/
        """
        meal = self.get_object() # Hangi yemek olduğunu URL'den (pk) al
        user = request.user      # Kimin yolladığını jetondan (token) al

        # Gelen JSON verisini ({"score": 5}) al
        data = request.data

        # Tıpkı ankette olduğu gibi 'update_or_create' kullanıyoruz.
        # Bu, kullanıcının puanını sonradan değiştirebilmesini sağlar.
        rating, created = MealRating.objects.update_or_create(
            user=user,
            meal=meal,
            defaults={'score': data.get('score')}
        )

        # Cevabı temiz JSON olarak döndür
        serializer = MealRatingSerializer(rating)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        
        return Response(serializer.data, status=status_code)

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

