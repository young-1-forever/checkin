const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    try {
        const token = core.getInput('github-token');
        const octokit = github.getOctokit(token);

        const { data: existingState } = await octokit.rest.actions.getWorkflowRun({
            owner: 'young-1-forever',
            repo: 'checkin',
            run_id: github.context.runId
        });

        if (existingState.output.notGetBalance) {
            console.log('check-glados-balance 已经执行过，跳过...');
            return;
        }

        const balance = await getGladosBalance();

        if (balance >= 80) {
            await octokit.rest.actions.updateWorkflowRun({
                owner: 'young-1-forever',
                repo: 'checkin',
                run_id: github.context.runId,
                data: {
                    state: 'completed',
                    conclusion: 'success',
                    output: {
                        title: 'check-glados-balance 已执行',
                        notGetBalance: true
                    }
                }
            });

            // 设置已执行标志
            console.log('余额大于 95，标记 check-glados-balance 已执行...');
            return balance;
        }
        return balance;
    } catch (error) {
        console.error('发生错误:', error);
        core.setFailed(error.message);
    }
}

async function getGladosBalance() {
    const cookie = process.env.GLADOS
    if (!cookie) return
    try {
        const headers = {
            'cookie': cookie,
            'referer': 'https://glados.rocks/console/checkin',
            'user-agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
        }
        const checkin = await fetch('https://glados.rocks/api/user/checkin', {
            method: 'POST',
            headers: { ...headers, 'content-type': 'application/json' },
            body: '{"token":"glados.one"}',
        }).then((r) => r.json())
        console.log("Left points = " + checkin.list[0].balance);
        return checkin.list[0].balance;
    } catch (error) {
        console.error('Checkin Error:', error);
        return null;
    }
}

const notify = async (contents) => {
    const token = process.env.NOTIFY
    if (!token || !contents) return
    await fetch(`https://www.pushplus.plus/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            token,
            title: contents[0],
            content: contents.join('<br>'),
            template: 'markdown',
        }),
    })
}

const main = async () => {
    const result = await run();
    if (result) {
        await notify(result);
    }
}

main()
