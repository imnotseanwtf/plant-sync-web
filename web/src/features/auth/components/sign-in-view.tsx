'use client';

import { useActionState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { signIn, type SignInState } from '../actions';

export function SignInView() {
  const [state, action, isPending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <div className='flex min-h-svh items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle>Plant Sync</CardTitle>
          <CardDescription>Sign in to manage your plants and devices.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className='flex flex-col gap-4'>
            {state.error && (
              <Alert variant='destructive'>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <div className='flex flex-col gap-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                autoComplete='username'
                defaultValue={state.email}
                required
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                required
              />
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox id='remember' name='remember' />
              <Label htmlFor='remember' className='font-normal'>
                Remember me
              </Label>
            </div>
            <LoadingButton loading={isPending} type='submit'>
              Sign in
            </LoadingButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
