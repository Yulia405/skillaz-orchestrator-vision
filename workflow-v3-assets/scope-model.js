// Shared by the browser and AI worker: an explicit answer must survive model turns.
(function(root) {
  const norm = value => String(value || '').toLowerCase().replace(/ё/g,'е');
  function parse(text, regions = []) {
    const value = norm(text);
    const allRegions = /(?:все|всех|любые|любых)\s+(?:регионы|регионах|регионов|города|городах|территории|площадки)|по всей (?:россии|стране)|вся россия|вся\s+(?:организационная\s+|орг)?структура|всю\s+(?:организационную\s+|орг)?структуру|все подразделения|вся компания/.test(value);
    const tokens = value.split(/[^а-яa-z0-9-]+/).filter(Boolean);
    const mentions = label => {
      const normalized = norm(label);
      if (value.includes(normalized)) return true;
      return !normalized.includes(' ') && tokens.some(token => normalized.length > 4 && token.slice(0,normalized.length-1) === normalized.slice(0,-1));
    };
    const cities = regions.flatMap(region => region.cities.filter(mentions).map(city => ({id:`${region.id}-city-${norm(city)}`,label:city,regionId:region.id})));
    const selectedRegions = regions.filter(region => mentions(region.name));
    return { confirmed:allRegions || Boolean(cities.length || selectedRegions.length), allRegions,
      locationIds:allRegions ? ['all-regions'] : [...new Set([...cities.map(city=>city.id),...selectedRegions.map(region=>region.id)])],
      label:allRegions ? 'Все регионы присутствия' : [...cities.map(city=>city.label),...selectedRegions.map(region=>region.name)].join(', '),
      allStructure:/вс[яюе]\s+(?:организационн\S*\s+|орг)?структур|все подразделения|вся компания/.test(value)
    };
  }
  root.SkillazScope = {parse};
})(globalThis);
