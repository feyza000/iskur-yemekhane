from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response as APIResponse
from django.db.models import Count

from ..models import Survey, Response, Question, Answer
from ..serializers import SurveySerializer, ResponseSerializer, QuestionSerializer
from ..permissions import IsStaffOrReadOnly

class SurveyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Survey instances.
    """
    serializer_class = SurveySerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        # 1. Staff users see everything
        if self.request.user.is_staff:
            return Survey.objects.all().order_by('-created_at')

        # 2. Regular users see only active surveys
        queryset = Survey.objects.filter(is_active=True)
        
        # Exclude surveys the user has already responded to (in list view)
        if self.action == 'list' and self.request.user.is_authenticated:
            queryset = queryset.exclude(responses__user=self.request.user)
            
        return queryset

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """
        Custom action to retrieve aggregated results for a specific survey.
        OPTIMIZED: Uses 1 Query to fetch all answers, then processes in Python.
        """
        survey = self.get_object()
        questions = survey.questions.all().order_by('order')
        
        # 1. Fetch ALL answers for this survey in one go (Values only for performance)
        all_answers = Answer.objects.filter(question__survey=survey).values('question_id', 'value')

        # 2. Group answers by Question ID in memory
        from collections import defaultdict
        answers_by_question = defaultdict(list)
        for ans in all_answers:
            answers_by_question[ans['question_id']].append(ans['value'])

        results_data = []
        
        for q in questions:
            # Retrieve answer values list from memory (No DB Call)
            values = answers_by_question[q.id]
            total_responses = len(values)

            question_data = {
                'id': q.id,
                'text': q.text,
                'type': q.question_type,
                'total': total_responses,
                'results': None
            }
            
            # 1. Text and Date inputs -> Return Raw List (Limit 50)
            if q.question_type in ['text', 'date']:
                # Reverse order simulate (latest first if we had dates, but here just list)
                # Ideally we would fetch IDs too if we wanted strict sorting, but this is sufficient.
                question_data['results'] = values[::-1][:50] 
            
            # 2. Choice and Multiple inputs -> Aggregation
            elif q.question_type in ['choice', 'multiple']:
                # Equivalent to .values('value').annotate(count=Count('id'))
                stats = {}
                # Initialize options with 0
                if q.options:
                    # Helper to safe split
                    options_list = [opt.strip() for opt in str(q.options).split(',')]
                    stats = {opt: 0 for opt in options_list}

                for val in values:
                    if not val: continue
                    
                    if ',' in val and q.question_type == 'multiple':
                        parts = [p.strip() for p in val.split(',')]
                        for p in parts:
                            stats[p] = stats.get(p, 0) + 1
                    else:
                        v_str = val.strip()
                        stats[v_str] = stats.get(v_str, 0) + 1
                            
                question_data['results'] = stats

            # 3. Star and Scale inputs -> Average & Distribution
            elif q.question_type in ['star', 'scale']:
                max_val = 10 if q.question_type == 'scale' else 5
                distribution = {str(i): 0 for i in range(1, max_val + 1)}
                
                total_sum = 0
                valid_count = 0
                
                for val_str in values:
                    try:
                        val_int = int(float(val_str))
                        k = str(val_int)
                        if k in distribution:
                            distribution[k] += 1
                        
                        # Only sum valid ranges for average
                        if 1 <= val_int <= max_val:
                            total_sum += val_int
                            valid_count += 1
                    except (ValueError, TypeError):
                        pass

                avg = 0
                if valid_count > 0:
                    avg = round(total_sum / valid_count, 1)

                question_data['results'] = {
                    'average': avg,
                    'distribution': distribution
                }

            results_data.append(question_data)
        
        return APIResponse(results_data)

class QuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Questions within a Survey.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

class ResponseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Survey Responses (Submissions).
    """
    queryset = Response.objects.all()
    serializer_class = ResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete'] 

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Response.objects.all()
        return Response.objects.filter(user=user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
