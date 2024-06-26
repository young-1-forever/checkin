const maxPoint = 93;

async function getBalance(cookie) {
    const headers = {
        'cookie': cookie,
        'referer': 'no-referrer',
        'user-agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
    };
    const balance = await fetch('https://glados.rocks/api/user/balance', {
        method: 'GET',
        headers,
    }).then((r) => r.json())
    try {
        const pointsAsset = balance.data.find(item => item.asset === "points");
        const leftDays = balance.data.find(item => item.asset === "ss-1");
        if (pointsAsset) {
            const result = {
                points: pointsAsset.balance,
                leftDays: leftDays.balance,
            };
            return result;
        } else {
            console.log("No asset with value 'points' found.");
        }
    } catch (error) {
        console.error("Error parsing JSON:", error);
    }
    return null;
}

async function checkInGlados(cookie, failNameSuffix) {
    if (!cookie) return;
    const { points, leftDays } = await getBalance(cookie);
    console.log("getBalance points = " + points + ", failNameSuffix = " + failNameSuffix);
    if ((points && points <= maxPoint) || leftDays >= 2) {
        try {
            const headers = {
                'cookie': cookie,
                'referer': 'https://glados.rocks/console/checkin',
                'user-agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
            };

            const checkin = await fetch('https://glados.rocks/api/user/checkin', {
                method: 'POST',
                headers: { ...headers, 'content-type': 'application/json' },
                body: '{"token":"glados.one"}',
            }).then((r) => r.json());

            const status = await fetch('https://glados.rocks/api/user/status', {
                method: 'GET',
                headers,
            }).then((r) => r.json())
            console.log("check in over, new left points = " + checkin.list[0].balance + ", email = " + status.data.email);

            return [
                'Checkin OK',
                `${checkin.message}`,
                `Left points ${Number(checkin.list[0].balance)}`,
                `email ${status.data.email}`,
            ];
        } catch (error) {
            console.error('Checkin Error:', error);
            return null;
        }
    } else {
        console.log('Conditions not met, skipping checkin.');
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

async function step(cookie, suffix) {
    const result = await checkInGlados(cookie, suffix);
    if (result && Number(result[2].split(' ')[2]) >= maxPoint) {
        await notify(result);
    }
}

const main = async () => {
    const cookie232 = process.env.GLADOS_232;
    const cookieWhich = process.env.GLADOS_WHICH;
    step(cookie232, "qq");
    step(cookieWhich, "gmail");
}

main()
