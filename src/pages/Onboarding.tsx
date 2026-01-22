import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const AUTH_API = 'https://functions.poehali.dev/27952831-fa5c-43a1-8177-575cd7a32963';

const Onboarding = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleComplete = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите ваше ФИО',
        variant: 'destructive'
      });
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо принять все условия',
        variant: 'destructive'
      });
      return;
    }

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${AUTH_API}?action=complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          full_name: fullName,
          email: email || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('status', 'ONBOARDING_COMPLETE');
        toast({
          title: 'Добро пожаловать! 🎉',
          description: 'Теперь выберите тариф'
        });
        navigate('/subscription');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось завершить регистрацию',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Проблема соединения',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-accent/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
            <Icon name="UserCheck" className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-2xl font-display font-bold">
            Расскажите о себе
          </CardTitle>
          <CardDescription>
            Заполните данные для продолжения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">ФИО *</label>
            <Input
              type="text"
              placeholder="Иванов Иван Иванович"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email (опционально)</label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Для получения чеков и уведомлений
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-accent/10">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                Я принимаю{' '}
                <a href="#" className="text-accent hover:underline">
                  условия пользовательского соглашения
                </a>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="privacy"
                checked={acceptedPrivacy}
                onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
              />
              <label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                Я принимаю{' '}
                <a href="#" className="text-accent hover:underline">
                  политику конфиденциальности
                </a>
              </label>
            </div>
          </div>

          <Button
            onClick={handleComplete}
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-accent/90 text-black font-semibold"
          >
            {loading ? 'Сохранение...' : 'Продолжить'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
