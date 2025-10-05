const StyleDictionary = require('style-dictionary');

module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'artifacts/',
      files: [
        {
          destination: 'design-tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true
          }
        }
      ]
    },
    xaml: {
      buildPath: 'artifacts/',
      transforms: ['attribute/cti', 'name/cti/pascal', 'color/hex'],
      files: [
        {
          destination: 'design-tokens.xaml',
          format: 'xaml/resourceDictionary',
          options: {
            outputReferences: false
          }
        }
      ]
    },
    json: {
      buildPath: 'artifacts/',
      files: [
        {
          destination: 'design-tokens.json',
          format: 'json/flat'
        }
      ]
    }
  }
};

// Register custom XAML format
StyleDictionary.registerFormat({
  name: 'xaml/resourceDictionary',
  formatter: function(dictionary) {
    return `<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation">
${dictionary.allTokens.map(token => {
  const name = token.name.replace(/\./g, '');
  if (token.type === 'color') {
    return `    <Color x:Key="${name}">${token.value}</Color>`;
  }
  return `    <System:String x:Key="${name}">${token.value}</System:String>`;
}).join('\n')}
</ResourceDictionary>`;
  }
});
