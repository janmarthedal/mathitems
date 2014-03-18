from django.conf.urls import patterns, url

urlpatterns = patterns('users.views',
    url(r'^login$', 'login'),
    url(r'^logout$', 'logout'),
    url(r'^current$', 'profile_current'),
    url(r'^profile/(\d+)$', 'profile'),
    url(r'^profile/(\d+)/items$', 'items'),
    url(r'^profile/edit$', 'profile_edit'),
    url(r'^list$', 'index'),
    url(r'^administration$', 'administration'),
)
