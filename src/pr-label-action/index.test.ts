import { describe, it, beforeEach, vi, expect } from 'vitest';

describe('pr-label-action', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it('should fail if GITHUB_TOKEN is not set', async () => {
    process.env.GITHUB_TOKEN = '';
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        setFailed: vi.fn(),
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    const { run } = await import('../pr-label-action/index');
    const core = await import('@actions/core');
    await run();
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('GITHUB_TOKEN'));
    vi.resetModules();
  });

  it('should install projex if not present', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const infoMock = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        info: infoMock,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => { throw new Error('not found'); }) // projex --version
        .mockImplementationOnce(() => undefined) // npm install -g projex
        .mockImplementationOnce(() => ''), // projex pull-request labels suggest
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(infoMock).toHaveBeenCalledWith(expect.stringContaining('Instalando projex CLI globalmente'));
    vi.resetModules();
  });
});
