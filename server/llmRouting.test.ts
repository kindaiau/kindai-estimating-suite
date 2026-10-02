import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const env = vi.hoisted(() => ({ openAiApiKey: 'mock-openai', openAiModel: undefined as string | undefined, forgeApiKey: 'mock-forge', forgeApiUrl: 'https://forge.test' }));
vi.mock('./_core/env', () => ({ ENV: env }));
import { invokeLLM } from './_core/llm';
const media = [{ role: 'user' as const, content: [{ type: 'image_url' as const, image_url: { url: 'https://test.invalid/plan.png' } }] }];
const fetchMock = vi.fn();
beforeEach(() => { env.openAiApiKey = 'mock-openai'; env.openAiModel = undefined; env.forgeApiKey = 'mock-forge'; vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset(); });
afterEach(() => vi.unstubAllGlobals());
function response(body: unknown) { return { ok: true, json: async () => body }; }
it('routes media to Responses with default/override; no real API call', async () => {
  fetchMock.mockResolvedValue(response({ status: 'completed', output_text: '{}' }));
  await invokeLLM({ messages: media });
  expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe('gpt-5.5');
  env.openAiModel = 'test-override'; await invokeLLM({ messages: media });
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).model).toBe('test-override');
});
it('routes text and tools to Forge even with OpenAI key', async () => {
  fetchMock.mockResolvedValue(response({ choices: [] }));
  await invokeLLM({ messages: [{ role: 'user', content: 'Text only' }] });
  const tool = { type: 'function' as const, function: { name: 'lookup', parameters: { type: 'object', properties: {} } } };
  await invokeLLM({ messages: media, tools: [tool], tool_choice: 'auto' });
  for (const call of fetchMock.mock.calls) { expect(call[0]).toBe('https://forge.test/v1/chat/completions'); expect(JSON.parse(call[1].body).model).toBe('gemini-2.5-flash'); }
});
it('missing OpenAI key uses Forge; missing both fails before fetch', async () => {
  env.openAiApiKey = ''; fetchMock.mockResolvedValue(response({ choices: [] }));
  await invokeLLM({ messages: media }); expect(fetchMock).toHaveBeenCalledTimes(1);
  env.forgeApiKey = ''; await expect(invokeLLM({ messages: media })).rejects.toThrow('BUILT_IN_FORGE_API_KEY'); expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('does not fallback after an OpenAI error', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 503, statusText: 'Unavailable', text: async () => 'mock outage' });
  await expect(invokeLLM({ messages: media })).rejects.toThrow('503'); expect(fetchMock).toHaveBeenCalledTimes(1);
});
