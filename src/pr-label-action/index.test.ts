  it('should warn if getLabel throws error not 404 and still try to create label (cover line 107)', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const warningMock = vi.fn();
    const infoMock = vi.fn();
    const createLabelMock = vi.fn();
    const addLabelsMock = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        warning: warningMock,
        info: infoMock,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'label:desc:#abc123'),
    }));
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({
        rest: {
          pulls: { get: vi.fn().mockResolvedValue({ data: { labels: [] } }) },
          issues: {
            getLabel: vi.fn().mockRejectedValue({ status: 500 }),
            createLabel: createLabelMock,
            addLabels: addLabelsMock,
          },
        },
      }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(warningMock).toHaveBeenCalledWith(expect.stringContaining('Error consultando el label'));
    expect(createLabelMock).toHaveBeenCalled();
    vi.resetModules();
  });

  it('should warn if createLabel fails (cover line 140)', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const warningMock = vi.fn();
    const infoMock = vi.fn();
    const getLabelMock = vi.fn().mockRejectedValue({ status: 404 });
    const createLabelMock = vi.fn().mockRejectedValue(new Error('fail create'));
    const addLabelsMock = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        warning: warningMock,
        info: infoMock,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'label:desc:#abc123'),
    }));
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({
        rest: {
          pulls: { get: vi.fn().mockResolvedValue({ data: { labels: [] } }) },
          issues: {
            getLabel: getLabelMock,
            createLabel: createLabelMock,
            addLabels: addLabelsMock,
          },
        },
      }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(warningMock).toHaveBeenCalledWith(expect.stringContaining('No se pudo crear/actualizar el label'));
    vi.resetModules();
  });

  it('should cover global catch with thrown error (core.setFailed, lines 180-181)', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const setFailed = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        setFailed,
        getInput: vi.fn().mockImplementation(() => { throw new Error('fail input global'); }),
      };
    });
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(setFailed).toHaveBeenCalledWith(expect.stringContaining('fail input global'));
    vi.resetModules();
  });
  it('should warn if updateLabel fails (cover updateLabel error path)', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const warningMock = vi.fn();
    const infoMock = vi.fn();
    const updateLabelMock = vi.fn().mockRejectedValue(new Error('fail update'));
    const getLabelMock = vi.fn().mockResolvedValue({}); // label exists
    const addLabelsMock = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        warning: warningMock,
        info: infoMock,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'label:desc:#abc123'),
    }));
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({
        rest: {
          pulls: { get: vi.fn().mockResolvedValue({ data: { labels: [] } }) },
          issues: {
            getLabel: getLabelMock,
            updateLabel: updateLabelMock,
            addLabels: addLabelsMock,
          },
        },
      }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(warningMock).toHaveBeenCalledWith(expect.stringContaining('No se pudo crear/actualizar el label'));
    vi.resetModules();
  });

  it('should cover global catch with thrown error (core.setFailed)', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const setFailed = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        setFailed,
        getInput: vi.fn().mockImplementation(() => { throw new Error('fail input global'); }),
      };
    });
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(setFailed).toHaveBeenCalledWith(expect.stringContaining('fail input global'));
    vi.resetModules();
  });
  it('should parse label with only name', async () => {
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
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'simplelabel'),
    }));
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({ rest: { pulls: { get: vi.fn().mockResolvedValue({ data: { labels: [] } }) }, issues: {} } }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(infoMock).toHaveBeenCalledWith("Etiqueta sugerida: 'simplelabel' sin color");
    vi.resetModules();
  });

  it('should parse label with name and color', async () => {
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
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'label:#123abc'),
    }));
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({ rest: { pulls: { get: vi.fn().mockResolvedValue({ data: { labels: [] } }) }, issues: {} } }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(infoMock).toHaveBeenCalledWith("Etiqueta sugerida: 'label' con color: #123abc");
    vi.resetModules();
  });

  it('should parse label with name and desc', async () => {
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
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'label:desc'),
    }));
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({ rest: { pulls: { get: vi.fn().mockResolvedValue({ data: { labels: [] } }) }, issues: {} } }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(infoMock).toHaveBeenCalledWith("Etiqueta sugerida: 'label:desc' sin color");
    vi.resetModules();
  });

  it('should parse label with name, desc and color', async () => {
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
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'label:desc:#abc123'),
    }));
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({ rest: { pulls: { get: vi.fn().mockResolvedValue({ data: { labels: [] } }) }, issues: {} } }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(infoMock).toHaveBeenCalledWith("Etiqueta sugerida: 'label:desc' con color: #abc123");
    vi.resetModules();
  });

  it('should warn if getLabel throws error not 404 and still try to create label', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const warningMock = vi.fn();
    const infoMock = vi.fn();
    const createLabelMock = vi.fn();
    const addLabelsMock = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        warning: warningMock,
        info: infoMock,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'label:desc:#abc123'),
    }));
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({
        rest: {
          pulls: { get: vi.fn().mockResolvedValue({ data: { labels: [] } }) },
          issues: {
            getLabel: vi.fn().mockRejectedValue({ status: 500 }),
            createLabel: createLabelMock,
            addLabels: addLabelsMock,
          },
        },
      }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(warningMock).toHaveBeenCalledWith(expect.stringContaining('Error consultando el label'));
    expect(createLabelMock).toHaveBeenCalled();
    vi.resetModules();
  });
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

  it('should handle error installing projex', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const setFailed = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        setFailed,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => { throw new Error('not found'); }) // projex --version
        .mockImplementationOnce(() => { throw new Error('fail install'); }), // npm install -g projex
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(setFailed).toHaveBeenCalledWith(expect.stringContaining('No se pudo instalar projex CLI'));
    vi.resetModules();
  });

  it('should parse labels and sync with octokit', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const infoMock = vi.fn();
    const warningMock = vi.fn();
    const getInputMock = vi.fn().mockReturnValue('123');
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        info: infoMock,
        warning: warningMock,
        getInput: getInputMock,
      };
    });
    // Mock execSync para devolver etiquetas sugeridas
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0') // projex --version
        .mockImplementationOnce(() => 'type:feat:#ff0000,scope:bug:#00ff00'), // projex pull-request labels suggest
    }));
    // Mock octokit
    const addLabelsMock = vi.fn();
    const updateLabelMock = vi.fn();
    const createLabelMock = vi.fn();
    const getLabelMock = vi.fn().mockRejectedValue({ status: 404 });
    const removeLabelMock = vi.fn();
    const pullsGetMock = vi.fn().mockResolvedValue({ data: { labels: [] } });
    const octokitMock = {
      rest: {
        pulls: { get: pullsGetMock },
        issues: {
          addLabels: addLabelsMock,
          updateLabel: updateLabelMock,
          createLabel: createLabelMock,
          getLabel: getLabelMock,
          removeLabel: removeLabelMock,
        },
      },
    };
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue(octokitMock),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(infoMock).toHaveBeenCalledWith(expect.stringContaining("Etiqueta sugerida: 'type:feat' con color: #ff0000"));
    expect(infoMock).toHaveBeenCalledWith(expect.stringContaining("Etiqueta sugerida: 'scope:bug' con color: #00ff00"));
    expect(createLabelMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'type:feat', color: 'ff0000' }));
    expect(createLabelMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'scope:bug', color: '00ff00' }));
    expect(addLabelsMock).toHaveBeenCalled();
    vi.resetModules();
  });

  it('should warn if label suggestion fails', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const warningMock = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        warning: warningMock,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0') // projex --version
        .mockImplementationOnce(() => { throw new Error('fail suggest'); }), // projex pull-request labels suggest
    }));
    // Mock octokit mínimo
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({ rest: { pulls: { get: vi.fn() }, issues: {} } }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(warningMock).toHaveBeenCalledWith(expect.stringContaining('No se pudieron sugerir etiquetas automáticamente'));
    vi.resetModules();
  });

  it('should handle octokit errors when creating/updating/assigning labels', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const infoMock = vi.fn();
    const warningMock = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        info: infoMock,
        warning: warningMock,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0') // projex --version
        .mockImplementationOnce(() => 'type:feat:#ff0000'), // projex pull-request labels suggest
    }));
    // Mock octokit con errores en createLabel, updateLabel, addLabels
    const addLabelsMock = vi.fn().mockRejectedValue(new Error('addLabels error'));
    const updateLabelMock = vi.fn().mockRejectedValue(new Error('updateLabel error'));
    const createLabelMock = vi.fn().mockRejectedValue(new Error('createLabel error'));
    const getLabelMock = vi.fn().mockResolvedValue({}); // Simula que el label existe
    const removeLabelMock = vi.fn();
    const pullsGetMock = vi.fn().mockResolvedValue({ data: { labels: [] } });
    const octokitMock = {
      rest: {
        pulls: { get: pullsGetMock },
        issues: {
          addLabels: addLabelsMock,
          updateLabel: updateLabelMock,
          createLabel: createLabelMock,
          getLabel: getLabelMock,
          removeLabel: removeLabelMock,
        },
      },
    };
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue(octokitMock),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(warningMock).toHaveBeenCalledWith(expect.stringContaining('No se pudo crear/actualizar el label'));
    expect(warningMock).toHaveBeenCalledWith(expect.stringContaining('No se pudo asignar el label'));
    vi.resetModules();
  });

  it('should handle error when getting PR labels', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const setFailed = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        setFailed,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'type:feat:#ff0000'),
    }));
    // Mock octokit para que falle pulls.get
    const pullsGetMock = vi.fn().mockRejectedValue(new Error('fail get PR'));
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({ rest: { pulls: { get: pullsGetMock }, issues: {} } }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(setFailed).toHaveBeenCalledWith(expect.stringContaining('fail get PR'));
    vi.resetModules();
  });

  it('should warn if label parsing fails', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const warningMock = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        warning: warningMock,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'not found'),
    }));
    // Mock octokit mínimo
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({ rest: { pulls: { get: vi.fn() }, issues: {} } }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(warningMock).not.toHaveBeenCalled(); // No warning, solo info de no sugeridas
    vi.resetModules();
  });

  it('should handle error when removing label', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const warningMock = vi.fn();
    const infoMock = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        warning: warningMock,
        info: infoMock,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'type:feat:#ff0000'),
    }));
    // Mock octokit para que falle removeLabel
    const removeLabelMock = vi.fn().mockRejectedValue(new Error('fail remove'));
    const pullsGetMock = vi.fn().mockResolvedValue({ data: { labels: ['type:feat'] } });
    const getLabelMock = vi.fn().mockRejectedValue({ status: 404 });
    const createLabelMock = vi.fn();
    const addLabelsMock = vi.fn();
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({
        rest: {
          pulls: { get: pullsGetMock },
          issues: {
            removeLabel: removeLabelMock,
            getLabel: getLabelMock,
            createLabel: createLabelMock,
            addLabels: addLabelsMock,
          },
        },
      }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(warningMock).toHaveBeenCalledWith(expect.stringContaining('No se pudo remover el label'));
    vi.resetModules();
  });

  it('should warn if getLabel throws error different from 404', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const warningMock = vi.fn();
    const infoMock = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        warning: warningMock,
        info: infoMock,
        getInput: vi.fn().mockReturnValue('123'),
      };
    });
    vi.doMock('child_process', () => ({
      execSync: vi
        .fn()
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'type:feat:#ff0000'),
    }));
    // Mock octokit para que getLabel lance error distinto a 404
    const getLabelMock = vi.fn().mockRejectedValue({ status: 500 });
    const pullsGetMock = vi.fn().mockResolvedValue({ data: { labels: [] } });
    const createLabelMock = vi.fn();
    const addLabelsMock = vi.fn();
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({
        rest: {
          pulls: { get: pullsGetMock },
          issues: {
            getLabel: getLabelMock,
            createLabel: createLabelMock,
            addLabels: addLabelsMock,
          },
        },
      }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(warningMock).toHaveBeenCalledWith(expect.stringContaining('Error consultando el label'));
    vi.resetModules();
  });

  it('should handle unexpected label parsing', async () => {
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
        .mockImplementationOnce(() => '1.0.0')
        .mockImplementationOnce(() => 'foo:bar:baz:extra'),
    }));
    // Mock octokit mínimo
    vi.doMock('@actions/github', async () => ({
      getOctokit: vi.fn().mockReturnValue({ rest: { pulls: { get: vi.fn().mockResolvedValue({ data: { labels: [] } }) }, issues: {} } }),
      context: { repo: { owner: 'me', repo: 'repo' } },
    }));
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(infoMock).toHaveBeenCalledWith('No hay etiquetas sugeridas.');
    vi.resetModules();
  });

  it('should handle global catch error', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const setFailed = vi.fn();
    vi.doMock('@actions/core', async () => {
      const actual = await vi.importActual<typeof import('@actions/core')>('@actions/core');
      return {
        ...actual,
        setFailed,
        getInput: vi.fn().mockImplementation(() => { throw new Error('fail input'); }),
      };
    });
    const { run } = await import('../pr-label-action/index');
    await run();
    expect(setFailed).toHaveBeenCalledWith(expect.stringContaining('fail input'));
    vi.resetModules();
  });
});
