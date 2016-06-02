from django.contrib.auth import logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.views.decorators.http import require_safe

from mathitems.models import MathItem

#import logging
#logger = logging.getLogger(__name__)

@require_safe
def home(request):
    items = MathItem.objects.order_by('-created_at')[:10]
    return render(request, 'main/home.html', {'items': items})

@require_safe
def login(request):
    return render(request, 'main/login.html', {
        'title': 'Sign In',
        'next': request.GET.get('next'),
    })

@login_required
@require_safe
def profile(request):
    """from social.apps.django_app.context_processors import backends as auth_backends
    backends = auth_backends(request)['backends']
    logger.info('User {} has providers: {}'.format(request.user.username,
        ', '.join(p.provider for p in backends['associated'])))"""
    return render(request, 'main/profile.html', {'title': 'Profile'})

@require_safe
def logout(request):
    auth_logout(request)
    return redirect('home')
