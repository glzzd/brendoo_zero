import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto bg-white border-t border-gray-200 px-4 py-4 md:px-6 ml-0">
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {t('copyright')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;