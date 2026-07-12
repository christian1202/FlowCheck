import LoginButton from '@/components/auth/LoginButton';

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          FlowCheck Admin
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage your events and scanners
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
