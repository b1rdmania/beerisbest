import React from 'react';

interface BeerGlassProps {
  beerLevel: number;
  isTilting: boolean;
}

const BeerGlass: React.FC<BeerGlassProps> = ({ beerLevel, isTilting }) => {
  // TODO: Implement the visual representation of the beer glass
  // Use beerLevel to set the height/fill of the beer
  // Use isTilting to potentially apply tilt transformations to the liquid surface

  const liquidHeight = `${beerLevel}%`;
  const liquidRotation = isTilting ? (Math.random() * 20 - 10) : 0; // Placeholder tilt

  return (
    <div className="relative w-[150px] h-[300px] border-4 border-gray-700 rounded-b-2xl overflow-hidden bg-gray-200/30 flex flex-col-reverse">
      {/* Glass structure - simple example */}
      {/* Beer liquid */}
      <div 
        className="w-full bg-amber-400 transition-all duration-100 ease-linear relative"
        style={{
          height: liquidHeight,
        }}
      >
        {/* Inner liquid surface for tilting - more complex to implement correctly */}
        <div 
          className="w-full h-full bg-amber-500 transform-origin-bottom transition-transform duration-100 ease-linear"
          style={{
            transform: `rotate(${liquidRotation}deg)`,
            // backgroundImage: `url('/beer.jpg')`, // Example using image from public folder
            // backgroundSize: 'cover',
            // backgroundRepeat: 'no-repeat',
            // backgroundPosition: 'bottom center',
          }}
        >
        </div>
      </div>
    </div>
  );
};

export default BeerGlass; 