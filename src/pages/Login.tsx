import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const AUTH_API = 'https://functions.poehali.dev/27952831-fa5c-43a1-8177-575cd7a32963';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [debugCode, setDebugCode] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.startsWith('8')) {
      return '+7' + numbers.slice(1);
    }
    if (numbers.startsWith('7')) {
      return '+' + numbers;
    }
    if (numbers.length > 0) {
      return '+7' + numbers;
    }
    return '';
  };

  const handleSendCode = async () => {
    if (phone.length < 10) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный номер телефона',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${AUTH_API}?action=send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatPhone(phone) })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('code');
        if (data.debug_code) {
          setDebugCode(data.debug_code);
        }
        toast({
          title: 'Код отправлен',
          description: 'Проверьте SMS'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить код',
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

  const handleVerifyCode = async () => {
    if (code.length !== 4) {
      toast({
        title: 'Ошибка',
        description: 'Введите 4-значный код',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${AUTH_API}?action=verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: formatPhone(phone), 
          code 
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Сохраняем данные пользователя
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('phone', data.phone);
        localStorage.setItem('status', data.status);

        if (data.is_new_user) {
          navigate('/onboarding');
        } else if (data.status === 'NEW_USER') {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Неверный код',
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
      <Card className="w-full max-w-md border-accent/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
            <Icon name="Smartphone" className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-2xl font-display font-bold">
            {step === 'phone' ? 'Вход в КоммуналкаAI' : 'Подтвердите номер'}
          </CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Введите номер телефона для входа' 
              : `Код отправлен на ${formatPhone(phone)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'phone' ? (
            <>
              <Input
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-center text-lg"
                maxLength={18}
              />
              <Button 
                onClick={handleSendCode}
                disabled={loading}
                className="w-full bg-gradient-to-r from-accent to-accent/90 text-black font-semibold"
              >
                {loading ? 'Отправка...' : 'Получить код'}
              </Button>
            </>
          ) : (
            <>
              {debugCode && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                  <p className="text-sm text-yellow-500">
                    Код для разработки: <strong>{debugCode}</strong>
                  </p>
                </div>
              )}
              <Input
                type="text"
                placeholder="· · · ·"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="text-center text-2xl tracking-[1em] font-bold"
                maxLength={4}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setStep('phone');
                    setCode('');
                    setDebugCode('');
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Назад
                </Button>
                <Button 
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-accent to-accent/90 text-black font-semibold"
                >
                  {loading ? 'Проверка...' : 'Войти'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
