export interface WeatherCodeInfo {
  icon: string;
  description: string;
}

export function getWeatherCodeInfo(code: number | null): WeatherCodeInfo {
  if (code === null) {
    return { icon: "·", description: "Condição indisponível" };
  }

  if (code === 0) return { icon: "☀️", description: "Céu limpo" };
  if (code === 1) return { icon: "🌤️", description: "Predominantemente limpo" };
  if (code === 2) return { icon: "⛅", description: "Parcialmente nublado" };
  if (code === 3) return { icon: "☁️", description: "Encoberto" };
  if (code === 45 || code === 48) return { icon: "🌫️", description: "Nevoeiro" };
  if ([51, 53, 55, 56, 57].includes(code)) {
    return { icon: "🌧️", description: "Garoa" };
  }
  if ([61, 63, 65, 66, 67].includes(code)) {
    return { icon: "🌧️", description: "Chuva" };
  }
  if ([71, 73, 75, 77].includes(code)) {
    return { icon: "❄️", description: "Neve" };
  }
  if ([80, 81, 82].includes(code)) {
    return { icon: "🌦️", description: "Pancadas de chuva" };
  }
  if ([85, 86].includes(code)) {
    return { icon: "🌨️", description: "Pancadas de neve" };
  }
  if ([95, 96, 99].includes(code)) {
    return { icon: "⛈️", description: "Trovoadas" };
  }

  return { icon: "·", description: "Condição indisponível" };
}