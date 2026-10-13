'use client';

import { useActionState, useState } from 'react';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { signIn, type SignInState } from '../actions';

const required = <sup className='text-destructive ml-0.5'>*</sup>;

/** Same layout as Filament's login card: logo, "Sign in", email, password with eye toggle, remember me. */
export function SignInView() {
  const [state, action, isPending] = useActionState<SignInState, FormData>(signIn, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className='flex min-h-svh items-center justify-center p-4'>
      <div className='bg-card w-full max-w-lg rounded-xl border p-12 shadow-xs'>
        <div className='flex flex-col items-center gap-2 pb-8'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/logo.png' alt='Plant Sync' className='h-28 w-auto' />
          <h1 className='text-2xl font-bold tracking-tight'>Sign in</h1>
        </div>
        <form action={action} className='flex flex-col gap-6'>
          {state.error && (
            <Alert variant='destructive'>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className='flex flex-col gap-2'>
            <Label htmlFor='email'>Email address{required}</Label>
            <Input
              id='email'
              name='email'
              type='email'
              autoComplete='username'
              defaultValue={state.email}
              required
              autoFocus
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='password'>Password{required}</Label>
            <div className='flex'>
              <Input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                required
                className='rounded-r-none'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='rounded-l-none border-l-0'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <Icons.eyeOff className='size-4' />
                ) : (
                  <Icons.eye className='size-4' />
                )}
              </Button>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <Checkbox id='remember' name='remember' />
            <Label htmlFor='remember' className='font-normal'>
              Remember me
            </Label>
          </div>
          <LoadingButton loading={isPending} type='submit' className='w-full'>
            Sign in
          </LoadingButton>
        </form>
      </div>
    </div>
  );
}
