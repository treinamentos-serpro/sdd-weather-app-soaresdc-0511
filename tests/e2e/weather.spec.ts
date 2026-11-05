import { expect, type Page, test } from '@playwright/test';

async function mockWeather(page: Page, { partial = false }: { partial?: boolean } = {}) {
  const requests = { forecast: 0 };
  await page.clock.setFixedTime(new Date('2026-11-05T12:00:00Z'));

  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    expect(new URL(route.request().url()).searchParams.get('name')).toBe('Lisboa');
    await route.fulfill({
      json: {
        results: [
          {
            id: 2267057,
            name: 'Lisboa',
            country: 'Portugal',
            admin1: 'Lisboa',
            latitude: 38.7167,
            longitude: -9.1333,
            timezone: 'Europe/Lisbon',
          },
        ],
      },
    });
  });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    requests.forecast += 1;
    await route.fulfill({
      json: {
        timezone: 'Europe/Lisbon',
        utc_offset_seconds: 0,
        current: {
          time: '2026-11-05T12:00',
          weather_code: 0,
          temperature_2m: partial ? null : 0,
          relative_humidity_2m: partial ? null : 65,
          wind_speed_10m: 10,
          wind_direction_10m: 180,
          wind_gusts_10m: 15,
          precipitation: partial ? null : 0,
          pressure_msl: 1015,
        },
        hourly: {
          time: [
            '2026-11-05T12:00',
            '2026-11-06T12:00',
            '2026-11-07T12:00',
            '2026-11-08T12:00',
            '2026-11-09T12:00',
          ],
          relative_humidity_2m: [65, 66, 67, 68, 69],
          wind_speed_10m: [10, 11, 12, 13, 14],
        },
        daily: {
          time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'],
          weather_code: [0, 1, 2, 3, 61],
          temperature_2m_min: [partial ? null : -2, -1, 0, 1, 2],
          temperature_2m_max: [5, 6, 7, 8, 9],
          wind_direction_10m_dominant: [180, 190, 200, 210, 220],
          wind_gusts_10m_max: [15, 16, 17, 18, 19],
          precipitation_sum: [0, 0, 0, 0, 2],
          precipitation_probability_max: [partial ? null : 0, 10, 20, 30, 70],
        },
      },
    });
  });

  return requests;
}

for (const status of [429, 503]) {
  test(`oferece retry manual do forecast após HTTP ${status} sem refazer geocoding`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date('2026-11-05T12:00:00Z') });
    const requests = await mockWeather(page);
    let attempts = 0;
    let searches = 0;
    page.on('request', (request) => {
      if (new URL(request.url()).hostname === 'geocoding-api.open-meteo.com') searches += 1;
    });
    await page.route('https://api.open-meteo.com/**', async (route) => {
      attempts += 1;
      if (attempts === 1) {
        await route.fulfill({
          status,
          json: { error: true, reason: 'Detalhe interno do provedor' },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('Lisboa');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    const city = page.getByRole('button', { name: /^Lisboa, Portugal/ });
    await city.click();

    await expect(page.getByRole('alert')).toHaveText(
      /Não foi possível consultar os dados do tempo\. Tente novamente\./,
    );
    await expect(page.getByText('Detalhe interno do provedor')).toHaveCount(0);
    await expect(city).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'Clima atual em Lisboa' })).toHaveCount(0);
    await page.clock.fastForward(60_000);
    expect(attempts).toBe(1);

    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByRole('heading', { name: 'Clima atual em Lisboa' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(attempts).toBe(2);
    expect(searches).toBe(1);
    expect(requests.forecast).toBe(1);
  });
}

test('mantém dados parciais utilizáveis sem converter campos ausentes para zero', async ({
  page,
}) => {
  const requests = await mockWeather(page, { partial: true });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /^Lisboa, Portugal/ }).click();

  const current = page.getByRole('region', { name: 'Clima atual em Lisboa' });
  await expect(current.getByText('Indisponível', { exact: true })).toHaveCount(3);
  await expect(current.getByText('10 km/h', { exact: true })).toBeVisible();
  const forecast = page.getByRole('region', { name: 'Próximos cinco dias' });
  await expect(forecast.getByRole('article')).toHaveCount(5);
  const firstDay = forecast.getByRole('article').first();
  await expect(firstDay.getByText('Indisponível', { exact: true })).toHaveCount(2);

  await page.getByRole('button', { name: 'Fahrenheit' }).click();
  await expect(current.getByText('Indisponível', { exact: true })).toHaveCount(3);
  await expect(current.getByText('32,0 °F', { exact: true })).toHaveCount(0);
  await expect(firstDay.getByText('41,0 °F', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('Indisponível', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(requests.forecast).toBe(1);
});

test('preserva clima e horário após refresh falho e substitui apenas após retry bem-sucedido', async ({
  page,
}) => {
  await mockWeather(page);
  let attempts = 0;
  await page.route('https://api.open-meteo.com/**', async (route) => {
    attempts += 1;
    if (attempts === 2) {
      await route.fulfill({ status: 503, json: { error: true } });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /^Lisboa, Portugal/ }).click();
  const current = page.getByRole('region', { name: 'Clima atual em Lisboa' });
  await expect(current.getByText('0,0 °C', { exact: true })).toBeVisible();
  const timestamp = page.getByText(/Última consulta bem-sucedida:/);
  const previousTimestamp = await timestamp.textContent();

  await page.getByRole('button', { name: 'Atualizar dados' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível consultar os dados do tempo.',
  );
  await expect(page.getByRole('status')).toHaveText('Desatualizado');
  await expect(current.getByText('0,0 °C', { exact: true })).toBeVisible();
  await expect(timestamp).toHaveText(previousTimestamp ?? '');
  expect(attempts).toBe(2);

  await page.clock.setFixedTime(new Date('2026-11-05T13:00:00Z'));
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(timestamp).toContainText('13:00:00');
  await expect(page.getByText('Desatualizado', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(attempts).toBe(3);
});

test('busca cidade, exibe clima e cinco dias e converte a temperatura para Fahrenheit', async ({
  page,
}) => {
  const requests = await mockWeather(page);
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const city = page.getByRole('button', { name: /^Lisboa, Portugal/ });
  await expect(city).toBeVisible();
  expect(requests.forecast).toBe(0);
  await city.click();

  await expect(page.getByRole('heading', { name: 'Clima atual em Lisboa' })).toBeVisible();
  const currentWeather = page.getByRole('region', { name: 'Clima atual em Lisboa' });
  await expect(currentWeather.getByText('0,0 °C', { exact: true })).toBeVisible();
  const forecast = page.getByRole('region', { name: 'Próximos cinco dias' });
  await expect(forecast).toBeVisible();
  await expect(
    forecast.getByRole('list', { name: 'Previsão de cinco dias' }).getByRole('listitem'),
  ).toHaveCount(5);

  const fahrenheit = page.getByRole('button', { name: 'Fahrenheit' });
  await fahrenheit.click();

  await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
  await expect(currentWeather.getByText('32,0 °F', { exact: true })).toBeVisible();
  await expect(currentWeather.getByText('0,0 °C', { exact: true })).toHaveCount(0);
  expect(requests.forecast).toBe(1);
});

test('mostra Nenhuma cidade encontrada quando o geocoding retorna sem results', async ({
  page,
}) => {
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    await route.fulfill({ json: {} });
  });
  await page.route('https://api.open-meteo.com/**', async (route) => {
    forecastRequests += 1;
    await route.abort('blockedbyclient');
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(
    page.getByRole('status').getByRole('heading', { name: 'Nenhuma cidade encontrada' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Resultados da busca' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
  expect(forecastRequests).toBe(0);
});

test('renderiza clima e previsão no fluxo principal em mobile 375x812', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const requests = await mockWeather(page);

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /^Lisboa, Portugal/ }).click();

  const currentWeather = page.getByRole('region', { name: 'Clima atual em Lisboa' });
  await expect(
    currentWeather.getByRole('heading', { name: 'Clima atual em Lisboa' }),
  ).toBeVisible();
  await expect(currentWeather.getByText('0,0 °C', { exact: true })).toBeVisible();
  const forecast = page.getByRole('region', { name: 'Próximos cinco dias' });
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await page.getByRole('button', { name: 'Fahrenheit' }).click();
  await expect(currentWeather.getByText('32,0 °F', { exact: true })).toBeVisible();

  expect(page.viewportSize()).toEqual({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(requests.forecast).toBe(1);
});
