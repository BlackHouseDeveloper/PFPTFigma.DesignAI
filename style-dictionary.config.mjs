import StyleDictionary from 'style-dictionary';

// Register custom XAML format
StyleDictionary.registerFormat({
  name: 'xaml/resourceDictionary',
  format: ({ dictionary }) => {
    const header = `<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
                    xmlns:system="clr-namespace:System;assembly=mscorlib">`;
    
    const tokens = dictionary.allTokens.map(token => {
      const name = token.name.replace(/\./g, '');
      
      if (token.type === 'color') {
        return `    <Color x:Key="${name}">${token.value}</Color>`;
      } else if (token.type === 'spacing' || token.type === 'borderRadius' || token.type === 'dimension') {
        // Extract numeric value and convert to Thickness or double
        const numValue = parseFloat(token.value);
        return `    <system:Double x:Key="${name}">${numValue}</system:Double>`;
      } else if (token.type === 'shadow') {
        return `    <system:String x:Key="${name}">${token.value}</system:String>`;
      } else if (token.type === 'typography') {
        // For typography, we'll create individual keys
        const props = [];
        if (token.fontFamily) props.push(`    <system:String x:Key="${name}FontFamily">${token.fontFamily}</system:String>`);
        if (token.fontSize) {
          const fontSizeValue = parseFloat(token.fontSize);
          if (!Number.isNaN(fontSizeValue)) {
            props.push(`    <system:Double x:Key="${name}FontSize">${fontSizeValue}</system:Double>`);
          }
        }
        if (token.fontWeight) props.push(`    <system:String x:Key="${name}FontWeight">${token.fontWeight}</system:String>`);
        if (token.lineHeight) {
          const lineHeightValue = parseFloat(token.lineHeight);
          if (!Number.isNaN(lineHeightValue)) {
            props.push(`    <system:Double x:Key="${name}LineHeight">${lineHeightValue}</system:Double>`);
          }
        }
        return props.join('\n');
      }
      
      return `    <system:String x:Key="${name}">${token.value}</system:String>`;
    }).join('\n');

    return `${header}
${tokens}
</ResourceDictionary>`;
  }
});

export default {
  source: ['src/Shared.UI/Design/tokens/app.tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'artifacts/',
      files: [
        {
          destination: 'design-tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
            selector: ':root'
          }
        }
      ]
    },
    xaml: {
      buildPath: 'artifacts/',
      transforms: ['attribute/cti', 'name/pascal', 'color/hex'],
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
