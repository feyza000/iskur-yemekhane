from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Survey, Question, Response, Answer
import random
from datetime import datetime, timedelta
from django.utils import timezone

class Command(BaseCommand):
    help = 'Populates the database with dummy data for demonstration'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("🧹 Eski veriler temizleniyor... (Admin hariç)"))
        
        # Temizlik
        Response.objects.all().delete()
        Question.objects.all().delete()
        Survey.objects.all().delete()
        # Sadece test öğrencilerini silelim, gerçek admin kalsın
        User.objects.filter(username__startswith='student').delete()

        self.stdout.write("👤 Kullanıcılar oluşturuluyor...")
        
        # 1. ADMIN & STUDENTS
        # Admin zaten varsa dokunma, yoksa oluştur
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@ozal.edu.tr', 'admin123')
            self.stdout.write(" - Admin oluşturuldu (admin / admin123)")

        students = []
        for i in range(1, 6):
            username = f'student{i}'
            user, created = User.objects.get_or_create(username=username, defaults={'email': f'{username}@ozal.edu.tr'})
            if created:
                user.set_password('123456')
                user.save()
            students.append(user)
        self.stdout.write(f" - {len(students)} adet öğrenci oluşturuldu (Şifre: 123456)")

        self.stdout.write("📝 Anketler oluşturuluyor...")

        # ---------------------------------------------------------
        # SURVEY 1: YEMEKHANE (Kapsamlı)
        # ---------------------------------------------------------
        s1 = Survey.objects.create(
            title="Ekim Ayı Yemekhane Memnuniyet Anketi",
            description="Üniversitemiz yemekhanesindeki hizmet kalitesini artırmak için görüşlerinize ihtiyacımız var.",
            is_active=True
        )

        # Sorular
        Question.objects.create(
            survey=s1, order=1, text="Yemeklerin genel lezzetinden ne kadar memnunsunuz?", 
            question_type='star', required=True, page_number=1
        )
        Question.objects.create(
            survey=s1, order=2, text="Yemekhane hijyenini 1-10 arasında puanlayın.", 
            question_type='scale', required=True, page_number=1
        )
        Question.objects.create(
            survey=s1, order=3, text="Porsiyonlar doyurucu mu?", 
            question_type='choice', options=["Evet, gayet yeterli", "İdare eder", "Hayır, yetersiz"], required=True, page_number=1
        )
        Question.objects.create(
            survey=s1, order=4, text="Hangi öğünlerde yemekhaneyi kullanıyorsunuz?", 
            question_type='multiple', options=["Kahvaltı", "Öğle Yemeği", "Akşam Yemeği"], required=False, page_number=1
        )
        Question.objects.create(
            survey=s1, order=5, text="Menüde daha sık görmek istediğiniz yemekler?", 
            question_type='text', required=False, page_number=2
        )

        # ---------------------------------------------------------
        # SURVEY 2: BAHAR ŞENLİĞİ (Kısa)
        # ---------------------------------------------------------
        s2 = Survey.objects.create(
            title="2025 Bahar Şenliği Planlaması",
            description="Bu yılki şenlikte hangi sanatçıları ve etkinlikleri görmek istersiniz?",
            is_active=True
        )
        Question.objects.create(
            survey=s2, order=1, text="Şenlik hangi tarihte yapılsın?", 
            question_type='choice', options=["Mayıs Başı", "Mayıs Ortası", "Haziran Başı"], required=True
        )
        Question.objects.create(
            survey=s2, order=2, text="Tercih ettiğiniz müzik türleri?", 
            question_type='multiple', options=["Pop", "Hip-Hop", "Rock", "Elektronik", "Halk Müziği"], required=True
        )
        Question.objects.create(
            survey=s2, order=3, text="Beklentiniz (1-5 Yıldız)", 
            question_type='star', required=True
        )

        # ---------------------------------------------------------
        # SURVEY 3: ESKİ ANKET (Pasif)
        # ---------------------------------------------------------
        s3 = Survey.objects.create(
            title="2024 Mezuniyet Töreni Anketi",
            description="Geçmiş dönem anketi.",
            is_active=False,
            created_at=timezone.now() - timedelta(days=365)
        )

        self.stdout.write("💬 Rastgele cevaplar üretiliyor...")

        # CEVAP ÜRETİMİ
        surveys = [s1, s2]
        
        for student in students:
            # Her öğrenci anketleri %80 ihtimalle çözsün
            for survey in surveys:
                if random.random() > 0.2:
                    # Response oluştur
                    response = Response.objects.create(user=student, survey=survey)
                    
                    # Soruları cevapla
                    for q in survey.questions.all():
                        val = ""
                        num_val = None

                        if q.question_type == 'star':
                            # Yıldız: 1-5
                            score = random.randint(3, 5) # Genelde mutlu olsunlar :)
                            val = str(score)
                            num_val = float(score)
                        
                        elif q.question_type == 'scale':
                            # Ölçek: 1-10
                            score = random.randint(5, 10)
                            val = str(score)
                            num_val = float(score)
                        
                        elif q.question_type == 'choice':
                            # Tek seçim
                            if q.options:
                                val = random.choice(q.options)
                        
                        elif q.question_type == 'multiple':
                            # Çoklu seçim: 1 veya 2 seçenek seçsinler
                            if q.options:
                                count = random.randint(1, min(2, len(q.options)))
                                selected = random.sample(q.options, count)
                                val = ", ".join(selected) # Basit string birleştirme
                        
                        elif q.question_type == 'text':
                            # Text
                            comments = ["Harika!", "Geliştirilmeli.", "Teşekkürler.", "Daha fazla sebze olsun.", "Memnunum."]
                            val = random.choice(comments)
                        
                        elif q.question_type == 'date':
                            val = "2025-05-15"

                        # Cevabı kaydet
                        Answer.objects.create(
                            response=response,
                            question=q,
                            value=val,
                            numeric_value=num_val
                        )
                    
                    self.stdout.write(f"   -> {student.username} '{survey.title}' anketini doldurdu.")

        self.stdout.write(self.style.SUCCESS('✅ Veritabanı başarıyla dolduruldu!'))