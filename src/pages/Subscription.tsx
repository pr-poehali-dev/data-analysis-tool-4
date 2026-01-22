import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const SUBSCRIPTIONS_API = 'https://functions.poehali.dev/ea187727-c615-4c36-9833-3a1a96be4b76';

const Subscription = () => {
  const [loading, setLoading] = useState<'trial' | 'yearly' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleActivateTrial = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      navigate('/login');
      return;
    }

    setLoading('trial');
    try {
      const response = await fetch(`${SUBSCRIPTIONS_API}?action=activate-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('status', 'TRIAL_ACTIVE');
        toast({
          title: 'Пробный период активирован! 🎉',
          description: 'У вас есть 14 дней бесплатного использования'
        });
        navigate('/coins');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось активировать триал',
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
      setLoading(null);
    }
  };

  const handlePurchaseYearly = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      navigate('/login');
      return;
    }

    // В реальном приложении здесь будет интеграция с ЮKassa
    setLoading('yearly');
    try {
      // Заглушка успешной оплаты
      const response = await fetch(`${SUBSCRIPTIONS_API}?action=purchase-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId,
          payment_successful: true 
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('status', 'SUBSCRIPTION_ACTIVE');
        toast({
          title: 'Подписка активирована! 🎉',
          description: 'Годовой доступ к сервису'
        });
        navigate('/coins');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось оформить подписку',
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
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-black mb-4">
            Выберите подписку
          </h1>
          <p className="text-xl text-muted-foreground">
            Начните с пробного периода или сразу оформите годовую подписку
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Пробная подписка */}
          <Card className="border-accent/20 hover:border-accent/40 transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <Icon name="Zap" className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-2xl font-display">Пробный период</CardTitle>
              <CardDescription>Попробуйте бесплатно 14 дней</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-black text-accent mb-2">Бесплатно</div>
                <p className="text-sm text-muted-foreground">на 14 дней</p>
              </div>

              <ul className="space-y-3">
                <li className="flex gap-2 items-start">
                  <Icon name="Check" className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Полный доступ ко всем функциям</span>
                </li>
                <li className="flex gap-2 items-start">
                  <Icon name="Check" className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Скидка 10% на оплату ЖКХ</span>
                </li>
                <li className="flex gap-2 items-start">
                  <Icon name="Check" className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Автоматические платежи</span>
                </li>
                <li className="flex gap-2 items-start">
                  <Icon name="Check" className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Без обязательств</span>
                </li>
              </ul>

              <Button
                onClick={handleActivateTrial}
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-accent to-accent/90 text-black font-semibold"
              >
                {loading === 'trial' ? 'Активация...' : 'Попробовать бесплатно'}
              </Button>
            </CardContent>
          </Card>

          {/* Годовая подписка */}
          <Card className="border-accent/40 bg-accent/5 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-accent text-black text-xs font-bold px-3 py-1 rounded-full">
              ВЫГОДНО
            </div>
            <CardHeader>
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-4">
                <Icon name="Crown" className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-2xl font-display">Годовая подписка</CardTitle>
              <CardDescription>Экономьте на долгосрочной подписке</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-black text-accent mb-2">3 000 ₽</div>
                <p className="text-sm text-muted-foreground">250 ₽/месяц при оплате за год</p>
              </div>

              <ul className="space-y-3">
                <li className="flex gap-2 items-start">
                  <Icon name="Check" className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Все возможности на 365 дней</span>
                </li>
                <li className="flex gap-2 items-start">
                  <Icon name="Check" className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Скидка 10% на оплату ЖКХ</span>
                </li>
                <li className="flex gap-2 items-start">
                  <Icon name="Check" className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Приоритетная поддержка</span>
                </li>
                <li className="flex gap-2 items-start">
                  <Icon name="Check" className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Автопродление (можно отключить)</span>
                </li>
              </ul>

              <Button
                onClick={handlePurchaseYearly}
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-accent via-accent to-accent/80 text-black font-semibold"
              >
                {loading === 'yearly' ? 'Обработка...' : 'Купить за 3 000 ₽'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-accent/5 rounded-xl border border-accent/10">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Icon name="Info" className="w-5 h-5 text-accent" />
            Как работает сервис
          </h3>
          <p className="text-sm text-muted-foreground">
            После оформления подписки вам нужно будет купить монеты. 
            200 монет = скидка 10% на один платёж за ЖКХ. 
            Монеты покупаются отдельно и не входят в стоимость подписки.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
