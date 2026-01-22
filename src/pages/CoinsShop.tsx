import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const SUBSCRIPTIONS_API = 'https://functions.poehali.dev/ea187727-c615-4c36-9833-3a1a96be4b76';

const CoinsShop = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePurchase = async (packageType: string, coins: number, price: number) => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      navigate('/login');
      return;
    }

    setLoading(packageType);
    try {
      const response = await fetch(`${SUBSCRIPTIONS_API}?action=purchase-coins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          package: packageType,
          payment_successful: true // Заглушка оплаты
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Монеты куплены! 🪙',
          description: `Вам начислено ${coins} монет`
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось купить монеты',
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

  const packages = [
    {
      id: 'basic',
      name: 'Базовый',
      coins: 200,
      price: 400,
      discount: 0,
      icon: 'Coins'
    },
    {
      id: 'economy',
      name: 'Эконом',
      coins: 600,
      price: 1150,
      discount: 4,
      icon: 'TrendingUp',
      popular: true
    },
    {
      id: 'profitable',
      name: 'Выгодный',
      coins: 1200,
      price: 2200,
      discount: 8,
      icon: 'Zap'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-black mb-4">
            Купите монеты
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            200 монет = скидка 10% на один платёж за коммуналку
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 rounded-full border border-accent/20">
            <Icon name="Info" className="w-5 h-5 text-accent" />
            <span className="text-sm">
              Монеты = ваша выгода при оплате ЖКХ
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {packages.map((pkg) => {
            const IconComponent = pkg.icon;
            const pricePerCoin = (pkg.price / pkg.coins).toFixed(2);

            return (
              <Card
                key={pkg.id}
                className={`border-accent/20 hover:border-accent/40 transition-all relative ${
                  pkg.popular ? 'md:scale-105 border-accent/40 bg-accent/5' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-black text-xs font-bold px-4 py-1 rounded-full">
                    ПОПУЛЯРНО
                  </div>
                )}
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon name={IconComponent} className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-xl font-display">{pkg.name}</CardTitle>
                  <CardDescription>
                    {pkg.coins} монет
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="text-3xl font-black text-accent mb-1">
                      {pkg.price} ₽
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pricePerCoin} ₽ за монету
                    </p>
                  </div>

                  {pkg.discount > 0 && (
                    <div className="py-2 px-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-500 font-semibold text-center">
                        Экономия {pkg.discount}%
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Хватит на:</span>
                      <span className="font-semibold">{pkg.coins / 200} платежей</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Скидка за платёж:</span>
                      <span className="font-semibold">10%</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePurchase(pkg.id, pkg.coins, pkg.price)}
                    disabled={loading !== null}
                    className={`w-full font-semibold ${
                      pkg.popular
                        ? 'bg-gradient-to-r from-accent via-accent to-accent/80 text-black'
                        : 'bg-gradient-to-r from-accent to-accent/90 text-black'
                    }`}
                  >
                    {loading === pkg.id ? 'Обработка...' : `Купить за ${pkg.price} ₽`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-accent/10 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Calculator" className="w-5 h-5 text-accent" />
                Пример расчёта
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Счёт за ЖКУ:</span>
                <span className="font-semibold">5 000 ₽</span>
              </div>
              <div className="flex justify-between text-green-500">
                <span>Скидка 10%:</span>
                <span className="font-semibold">-500 ₽</span>
              </div>
              <div className="flex justify-between text-orange-500">
                <span>Списано монет:</span>
                <span className="font-semibold">200 шт (400 ₽)</span>
              </div>
              <div className="h-px bg-accent/10 my-3"></div>
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Итого к оплате:</span>
                <span className="font-black text-accent">4 500 ₽</span>
              </div>
              <div className="flex justify-between text-green-500 font-semibold">
                <span>Ваша выгода:</span>
                <span>100 ₽</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/10 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="HelpCircle" className="w-5 h-5 text-accent" />
                Как это работает
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">1.</strong> Купите монеты один раз
              </p>
              <p>
                <strong className="text-foreground">2.</strong> При оплате ЖКУ система автоматически спишет 200 монет
              </p>
              <p>
                <strong className="text-foreground">3.</strong> Вы получите скидку 10% от суммы счёта
              </p>
              <p>
                <strong className="text-foreground">4.</strong> Одна скидка = один платёж в месяц
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoinsShop;
