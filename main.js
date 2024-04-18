import fs from 'fs/promises';
const maxPoint = 90;

async function saveData(failNameSuffix, data) {
    await fs.writeFile(`glados_data_${failNameSuffix}.json`, JSON.stringify(data));
}

async function readData(failNameSuffix) {
    try {
        const data = await fs.readFile(`glados_data_${failNameSuffix}.json`, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Read Data Error:', error);
        return null;
    }
}

async function getGladosBalance(cookie, failNameSuffix) {
    if (!cookie) return;
    const previousData = await readData(failNameSuffix);
    if (previousData && previousData.balance > maxPoint) {
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
            console.log("Left points = " + checkin.list[0].balance);

            const newData = {
                balance: Number(checkin.list[0].balance),
                email: checkin.status.data.email,
            };
            await saveData(failNameSuffix, newData);

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

async function step(cookie, suffix) {
    const result = await getGladosBalance(cookie, suffix);
    if (result && Number(result[2].split(' ')[2]) > maxPoint) {
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
