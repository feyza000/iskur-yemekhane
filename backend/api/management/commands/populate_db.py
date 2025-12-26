# backend/api/management/commands/populate_db.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Survey, Question, Response, Answer
import random
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Veritabanını sahte verilerle doldurur'

    def handle(self, *args, **kwargs):
        self.stdout.write("Veri üretimi başlıyor...")

        # 1. KULLANICILARI OLUŞTUR
        students = []
        names = ['Ahmet', 'Mehmet', 'Ayse', 'Fatma', 'Ali', 'Zeynep', 'Mustafa']
        
        for i, name in enumerate(names):
            username = f"{name.lower()}{i+1}"
            email = f"{username}@ozal.edu.tr"
            # get_or_create: Varsa getirme, yoksa oluşturma
            user, created = User.objects.get_or_create(username=username, defaults={'email': email})
            if created:
                user.set_password('123456') # Hepsinin şifresi: 123456
                user.save()
                self.stdout.write(f"Öğrenci oluşturuldu: {username}")
            students.append(user)

        # 2. ANKET 1: YEMEKHANE MEMNUNİYETİ
        survey1, _ = Survey.objects.get_or_create(
            title="Ekim Ayı Yemekhane Memnuniyet Anketi",
            defaults={'description': "Yemek kalitesi, hijyen ve çeşitlilik hakkındaki görüşleriniz.", 'is_active': True}
        )

        # Sorular
        q1_1, _ = Question.objects.get_or_create(survey=survey1, order=1, defaults={'text': "Yemeklerin lezzetinden memnun musunuz?", 'question_type': 'star'})
        q1_2, _ = Question.objects.get_or_create(survey=survey1, order=2, defaults={'text': "Porsiyonlar doyurucu mu?", 'question_type': 'choice', 'options': 'Evet, Hayır, Kısmen'})
        q1_3, _ = Question.objects.get_or_create(survey=survey1, order=3, defaults={'text': "Menüde daha sık görmek istediğiniz yemekler nelerdir?", 'question_type': 'text'})

        # 3. ANKET 2: BAHAR ŞENLİĞİ
        survey2, _ = Survey.objects.get_or_create(
            title="2025 Bahar Şenliği Planlaması",
            defaults={'description': "Şenlikte hangi etkinlikleri görmek istersiniz?", 'is_active': True}
        )

        q2_1, _ = Question.objects.get_or_create(survey=survey2, order=1, defaults={'text': "Şenlik kaç gün sürsün?", 'question_type': 'choice', 'options': '1 Gün, 2 Gün, 3 Gün'})
        q2_2, _ = Question.objects.get_or_create(survey=survey2, order=2, defaults={'text': "Hangi müzik türü ağırlıklı olsun?", 'question_type': 'choice', 'options': 'Pop, Rock, Rap, Halk Müziği'})
        q2_3, _ = Question.objects.get_or_create(survey=survey2, order=3, defaults={'text': "Genel beklentiniz nedir?", 'question_type': 'star'})

        self.stdout.write("Anketler ve sorular oluşturuldu.")

        # 4. RASTGELE CEVAPLAR OLUŞTUR
        # Her öğrenci rastgele anketleri çözsün
        surveys = [survey1, survey2]
        
        for student in students:
            for s in surveys:
                # %70 ihtimalle anketi çözmüş olsun
                if random.random() > 0.3:
                    # Daha önce çözmediyse
                    if not Response.objects.filter(user=student, survey=s).exists():
                        response = Response.objects.create(user=student, survey=s)
                        
                        for q in s.questions.all():
                            val = ""
                            if q.question_type == 'star':
                                val = str(random.randint(1, 5))
                            elif q.question_type == 'choice':
                                options = [opt.strip() for opt in q.options.split(',')]
                                val = random.choice(options)
                            elif q.question_type == 'text':
                                texts = ["Güzeldi", "Daha iyi olabilir", "Fena değil", "Harika!", "Geliştirilmeli"]
                                val = random.choice(texts)
                            
                            Answer.objects.create(response=response, question=q, value=val)
                        
                        self.stdout.write(f"{student.username} -> {s.title} anketini çözdü.")

        self.stdout.write(self.style.SUCCESS('Veritabanı başarıyla dolduruldu.'))