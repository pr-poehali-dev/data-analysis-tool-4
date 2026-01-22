import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const SUBSCRIPTIONS_API = 'https://functions.poehali.dev/ea187727-c615-4c36-9833-3a1a96be4b76';

interface UserStatus {
  user_status: string;
  has_subscription: boolean;
  subscription_type: string | null;
  subscription_end: string | null;
  coins_balance: number;
  needs_subscription: boolean;
  needs_coins: boolean;
  ready_for_payment: boolean;
}

const Dashboard = () => {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserStatus();
  }, []);

  const loadUserStatus = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${SUBSCRIPTIONS_API}?action=status&user_id=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setStatus(data);

        // Перенаправления по состоянию
        if (data.needs_subscription) {
          navigate('/subscription');
          return;
        }
        if (data.needs_coins) {
          navigate('/coins');
          return;
        }
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-accent/10 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-white via-accent to-accent/80 bg-clip-text text-transparent">
            КоммуналкаAI
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
          >
            <Icon name="LogOut" className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 py-8">
        {/* Статус карты */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="Crown" className="w-4 h-4" />
                Подписка
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status.has_subscription ? (
                <>
                  <div className="text-2xl font-black text-accent mb-1">
                    {status.subscription_type === 'trial' ? 'Пробная' : 'Годовая'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    До {status.subscription_end && formatDate(status.subscription_end)}
                  </p>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/subscription')}
                  className="bg-gradient-to-r from-accent to-accent/90 text-black"
                >
                  Оформить
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="Coins" className="w-4 h-4" />
                Баланс монет
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-accent mb-1">
                {status.coins_balance}
              </div>
              <p className="text-xs text-muted-foreground">
                {status.coins_balance >= 200 
                  ? `Хватит на ${Math.floor(status.coins_balance / 200)} платежей` 
                  : 'Недостаточно для скидки'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="CheckCircle2" className="w-4 h-4" />
                Статус
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-black mb-1 ${
                status.ready_for_payment ? 'text-green-500' : 'text-orange-500'
              }`}>
                {status.ready_for_payment ? 'Готов' : 'Не готов'}
              </div>
              <p className="text-xs text-muted-foreground">
                {status.ready_for_payment ? 'Можно оплачивать ЖКХ' : 'Нужна подписка или монеты'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Главное действие */}
        <Card className="border-accent/20 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-display">Оплата коммунальных услуг</CardTitle>
            <CardDescription>
              Получите скидку 10% за 200 монет при оплате счёта
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status.ready_for_payment ? (
              <Button
                size="lg"
                className="w-full md:w-auto bg-gradient-to-r from-accent via-accent to-accent/80 text-black font-semibold"
              >
                <Icon name="CreditCard" className="w-5 h-5 mr-2" />
                Оплатить коммуналку
              </Button>
            ) : (
              <div className="space-y-3">
                {status.needs_subscription && (
                  <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon name="AlertCircle" className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium">Нужна активная подписка</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate('/subscription')}
                      variant="outline"
                      className="border-orange-500/50 hover:bg-orange-500/10"
                    >
                      Оформить
                    </Button>
                  </div>
                )}
                {status.needs_coins && (
                  <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon name="AlertCircle" className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium">Недостаточно монет (минимум 200)</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate('/coins')}
                      variant="outline"
                      className="border-orange-500/50 hover:bg-orange-500/10"
                    >
                      Купить
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Быстрые действия */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-accent/10 bg-card/50 hover:bg-card/80 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Plus" className="w-5 h-5 text-accent" />
                Добавить лицевой счёт
              </CardTitle>
              <CardDescription>
                Подключите счета за электричество, газ, воду
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-accent/10 bg-card/50 hover:bg-card/80 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="History" className="w-5 h-5 text-accent" />
                История платежей
              </CardTitle>
              <CardDescription>
                Посмотрите все ваши операции и скидки
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="border-accent/10 bg-card/50 hover:bg-card/80 transition-all cursor-pointer"
            onClick={() => navigate('/coins')}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="ShoppingCart" className="w-5 h-5 text-accent" />
                Купить монеты
              </CardTitle>
              <CardDescription>
                Пополните баланс монет для скидок
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-accent/10 bg-card/50 hover:bg-card/80 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Settings" className="w-5 h-5 text-accent" />
                Настройки
              </CardTitle>
              <CardDescription>
                Управление профилем и подпиской
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
