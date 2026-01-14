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
            return Survey.objects.all().order_by('-created_at').prefetch_related('questions')

        # 2. Regular users see only active surveys
        queryset = Survey.objects.filter(is_active=True).prefetch_related('questions')
        
        # Exclude surveys the user has already responded to (in list view)
        if self.action == 'list' and self.request.user.is_authenticated:
            queryset = queryset.exclude(responses__user=self.request.user)
            
        return queryset

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """
        Custom action to retrieve aggregated results for a specific survey.
        OPTIMIZED: Uses SQL Aggregation on 'numeric_value' field.
        """
        from django.db.models import Avg, Count
        
        survey = self.get_object()
        questions = survey.questions.all().order_by('order')
        
        results_data = []
        
        for q in questions:
            question_data = {
                'id': q.id,
                'text': q.text,
                'type': q.question_type,
                'total': 0,
                'results': None
            }

            # 1. Text and Date -> List (Limit 50)
            if q.question_type in ['text', 'date']:
                # Fetch only values, order by ID desc
                values = Answer.objects.filter(question=q).exclude(value='').order_by('-id').values_list('value', flat=True)[:50]
                question_data['total'] = Answer.objects.filter(question=q).count()
                question_data['results'] = list(values)

            # 2. Choice/Multiple -> SQL Count (Group By value)
            elif q.question_type in ['choice', 'multiple']:
                # Note: multiple choice still stores strings like "A,B".
                # Precise SQL aggregation for 'Multiple' requires normalization or split logic.
                # For 'Choice', simple Count is enough.
                # Current implementation for 'multiple' in legacy code was doing python split.
                # For basic SQL optimization, we group by 'value'.
                stats_qs = Answer.objects.filter(question=q).values('value').annotate(count=Count('id')).order_by('value')
                
                stats = {}
                # Initialize options if available
                if q.options:
                    options_list = [opt.strip() for opt in str(q.options).split(',')]
                    stats = {opt: 0 for opt in options_list}

                total_responses = 0
                for item in stats_qs:
                    val = item['value']
                    count = item['count']
                    if not val: continue
                    
                    if q.question_type == 'multiple' and ',' in val:
                        # Fallback to Python splitting for this edge case or handle via improved logic later
                        # For now, simplistic approach:
                        parts = [p.strip() for p in val.split(',')]
                        for p in parts:
                            stats[p] = stats.get(p, 0) + count
                            total_responses += count 
                            # Note: Total responses logic might be slightly skewed for multiple if we count *options* vs *users*. 
                            # Usually response count is per user.
                    else:
                        v_str = val.strip()
                        stats[v_str] = stats.get(v_str, 0) + count
                        total_responses += count

                question_data['total'] = Answer.objects.filter(question=q).count()
                question_data['results'] = stats

            # 3. Star/Scale -> SQL Average on numeric_value
            elif q.question_type in ['star', 'scale']:
                # Extremely efficient SQL aggregation
                agg_data = Answer.objects.filter(question=q).aggregate(
                    average=Avg('numeric_value'),
                    total=Count('id')
                )
                
                # Distribution (1 star: 5 people, etc.)
                # Group by numeric_value
                dist_qs = Answer.objects.filter(question=q).values('numeric_value').annotate(count=Count('id')).order_by('numeric_value')
                
                max_val = 10 if q.question_type == 'scale' else 5
                distribution = {str(i): 0 for i in range(1, max_val + 1)}
                
                for item in dist_qs:
                    if item['numeric_value'] is not None:
                        val_int = int(item['numeric_value'])
                        if str(val_int) in distribution:
                            distribution[str(val_int)] += item['count']

                question_data['total'] = agg_data['total']
                question_data['results'] = {
                    'average': round(agg_data['average'], 1) if agg_data['average'] else 0,
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
    # Optimized QuerySet: Select Survey and Prefetch Answers
    queryset = Response.objects.all().select_related('survey').prefetch_related('answers')
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
