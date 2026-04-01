interface Props { message?: string; }

export default function LoadingSpinner({
  message = 'Chargement...'
}: Props) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    );
  }