from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response as APIResponse
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAdminUser
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView

from django.core.mail import send_mail
from django.utils.crypto import get_random_string

from .models import Survey, Response, User, Question, Answer
from .serializers import (
    SurveySerializer, ResponseSerializer, 
    UserRegisterSerializer, LoginSerializer, QuestionSerializer, UserAdminSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

class LoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # GÜNCELLEME: Frontend'e 'is_staff' bilgisini de gönderiyoruz
        return APIResponse({
            "token": token.key,
            "user_id": user.pk,
            "email": user.email,
            "username": user.username,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser
        }, status=status.HTTP_200_OK)

class SurveyViewSet(viewsets.ModelViewSet):
    """
    Artık hem okuma hem yazma (Create, Delete) yapılabilir.
    """
    serializer_class = SurveySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Search
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description'] # Başlık veya açıklamada arama yapar

    def get_queryset(self):
        # 1. Eğer kullanıcı PERSONEL (Admin/Staff) ise:
        # Hepsini görsün (Pasifleri de, çözdüklerini de)
        if self.request.user.is_staff:
            return Survey.objects.all().order_by('-created_at')

        # 2. Eğer NORMAL ÖĞRENCİ ise:
        # Sadece Aktifleri görsün
        queryset = Survey.objects.filter(is_active=True)
        
        # Ve çözdüklerini görmesin
        if self.action == 'list' and self.request.user.is_authenticated:
            queryset = queryset.exclude(responses__user=self.request.user)
            
        return queryset

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        survey = self.get_object()
        questions = survey.questions.all().order_by('order')
        
        results_data = []
        
        for q in questions:
            answers = Answer.objects.filter(question=q)
            total_responses = answers.count()

            question_data = {
                'id': q.id,
                'text': q.text,
                'type': q.question_type,
                'total': total_responses,
                'results': None
            }
            
            # 1. TEXT ve DATE (Liste olarak dön)
            if q.question_type in ['text', 'date']:
                # Son 50 cevabı listele
                question_data['results'] = [a.value for a in answers.order_by('-id')[:50]]
            
            # 2. CHOICE ve MULTIPLE (Seçenek sayımı)
            elif q.question_type in ['choice', 'multiple']:
                # Seçenekleri al (virgülle ayrılmış string ise listeye çevir)
                options = [opt.strip() for opt in q.options.split(',')] if q.options else []
                stats = {opt: 0 for opt in options}
                
                for a in answers:
                    if not a.value: continue
                    
                    # Multiple cevaplar "Elma, Armut" gibi virgüllü gelebilir
                    # Choice cevaplar tek gelir ama yine de split yapmak güvenlidir
                    selected_items = [s.strip() for s in a.value.split(',')]
                    
                    for s in selected_items:
                        if s in stats:
                            stats[s] += 1
                        # Seçenek metni sonradan değiştiyse veya listede yoksa da ekle
                        elif s: 
                            stats[s] = stats.get(s, 0) + 1
                            
                question_data['results'] = stats

            # 3. STAR ve SCALE (Ortalama ve Dağılım)
            elif q.question_type in ['star', 'scale']:
                vals = []
                distribution = {} 
                
                # Scale 1-10, Star 1-5 arası dağılım tablosu hazırlığı
                max_val = 10 if q.question_type == 'scale' else 5
                for i in range(1, max_val + 1):
                    distribution[str(i)] = 0
                
                for a in answers:
                    try:
                        val = float(a.value)
                        vals.append(val)
                        
                        # Dağılım grafiği için tam sayıya yuvarla (3.5 -> 3 gibi)
                        k = str(int(val)) 
                        if k in distribution:
                            distribution[k] += 1
                    except (ValueError, TypeError):
                        pass

                if vals:
                    avg = sum(vals) / len(vals)
                    question_data['results'] = {
                        'average': round(avg, 1),
                        'distribution': distribution
                    }
                else:
                    question_data['results'] = {
                        'average': 0,
                        'distribution': distribution
                    }

            results_data.append(question_data)
        
        return APIResponse(results_data)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

class ResponseViewSet(viewsets.ModelViewSet):
    """
    Anket cevaplarını kaydeder.
    """
    queryset = Response.objects.all()
    serializer_class = ResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Sadece create (POST) işlemine izin verelim, öğrenciler başkasının cevabını görmesin
    http_method_names = ['get', 'post', 'put', 'patch', 'delete'] 

    def get_queryset(self):
        # Admin her şeyi görür, Öğrenci sadece kendi cevaplarını görür
        user = self.request.user
        if user.is_staff:
            return Response.objects.all()
        return Response.objects.filter(user=user)

    def get_serializer_context(self):
        # Serializer'a 'request' bilgisini gönder ki user'ı alabilsin
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

class UserViewSet(viewsets.ModelViewSet):
    """
    Sadece Adminlerin erişebileceği Kullanıcı Yönetim Modülü.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserAdminSerializer
    permission_classes = [permissions.IsAdminUser]

    # Silme işlemine müdahale ediyoruz
    def perform_destroy(self, instance):
        # İşlemi yapan kullanıcı
        request_user = self.request.user
        
        # Eğer silinmek istenen kişi Superuser ise VE silmeye çalışan Superuser değilse
        if instance.is_superuser and not request_user.is_superuser:
             raise PermissionDenied("Personel yetkisiyle Süper Admin silinemez!")
        
        # Değilse normal sil
        instance.delete()

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_pass = request.data.get('password')
        if not new_pass:
            return APIResponse({'error': 'Şifre gönderilmedi.'}, status=400)
        
        user.set_password(new_pass)
        user.save()
        return APIResponse({'status': 'Şifre başarıyla güncellendi.'})

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        new_password = request.data.get('password')
        
        if not new_password:
            return APIResponse({'error': 'Şifre girilmedi.'}, status=400)
        
        user.set_password(new_password)
        user.save()
        return APIResponse({'status': 'Şifreniz başarıyla güncellendi.'})

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny] # Giriş yapmayanlar da kullanabilsin

    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return APIResponse({'error': 'Lütfen e-posta adresinizi giriniz.'}, status=400)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Güvenlik gereği "Böyle biri yok" dememek daha iyidir ama şimdilik diyelim
            return APIResponse({'error': 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.'}, status=404)
        
        # 1. Rastgele 8 haneli şifre oluştur
        new_password = get_random_string(length=8)
        
        # 2. Şifreyi kaydet
        user.set_password(new_password)
        user.save()
        
        # 3. E-posta gönder (Console'a düşecek)
        try:
            send_mail(
                subject='Yeni Şifreniz - Malatya Turgut Özal Üniversitesi',
                message=f'Merhaba {user.username},\n\nHesabınızın şifresi sıfırlandı.\nYeni Şifreniz: {new_password}\n\nLütfen giriş yaptıktan sonra şifrenizi değiştiriniz.',
                from_email='noreply@ozal.edu.tr',
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return APIResponse({'error': 'E-posta gönderilirken hata oluştu.'}, status=500)

        return APIResponse({'status': 'Yeni şifreniz e-posta adresinize gönderildi.'})