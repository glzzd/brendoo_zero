import React from 'react';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex justify-between ">
     <div className='flex-1'><img src="/abstract.png" alt="" className='h-[100vh] w-full' /></div>
     <div className='flex flex-1 items-center justify-center'>
      {children}

     </div>

    </div>
  );
};

export default PublicLayout;