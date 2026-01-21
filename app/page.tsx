import ExpenseForm from '@/components/ExpenseForm';
import AuthProvider from '@/components/AuthProvider';

export default function Home() {
  return (
    <AuthProvider>
      <ExpenseForm />
    </AuthProvider>
  );
}
