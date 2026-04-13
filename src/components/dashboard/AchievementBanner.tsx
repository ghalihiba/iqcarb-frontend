type Props = {
  name?: string;
};

export default function AchievementBanner({ name }: Props) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">

      {/* Image background */}
      <img
        src="/images/trophy-banner.png" 
        alt="Achievement"
        className="w-full h-40 object-cover"
      />

      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col justify-center pl-16 pr-24 pb-1 bg-gradient-to-r from-white/80 to-transparent dark:from-gray-900/80">

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Bravo pour vos progrès en climatologie !
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {name ? `${name}, ` : ''}
          Continuez à réduire votre impact carbone et à gravir les échelons.
        </p>

        <button className="mt-3 w-fit px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-full shadow">
           Découvrez des conseils
        </button>
      </div>
    </div>
  );
}