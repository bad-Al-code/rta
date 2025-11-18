import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from './login-form';

export function AuthCard() {
  return (
    <Tabs defaultValue="sign-in" className="w-[400px]">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Analytics Platform
          </CardTitle>
          <CardDescription>
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in" className="pt-4">
            <LoginForm />
          </TabsContent>
          <TabsContent value="sign-up" className="pt-4">
            <p className="text-center text-muted-foreground">Sign up form</p>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
