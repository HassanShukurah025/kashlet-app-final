import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !businessName) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error: err } = await signUp(email, password, businessName);
    setLoading(false);

    if (err) {
      setError(err === 'User already registered' ? 'An account with this email already exists' : err);
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-base-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-display text-text-primary">Kashlet</h1>
          <p className="text-body-m text-text-secondary mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-sm bg-status-error/10 border border-status-error/30 px-3 py-2 text-body-m text-status-error">
              {error}
            </div>
          )}
          <Input
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your business name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </form>

        <p className="text-body-m text-text-secondary text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
