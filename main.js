const glados = async () => {
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
      const status = await fetch('https://glados.rocks/api/user/status', {
        method: 'GET',
        headers,
      }).then((r) => r.json())
      console.log("Left points = " + checkin.list[0].balance);
      return [
        'Checkin OK',
        `${checkin.message}`,
        `Left points ${Number(checkin.list[0].balance)}`,
        `email ${status.data.email}`,
      ]
    } catch (error) {
      return [
        'Checkin Error',
        `${error}`,
        `<${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}>`,
      ]
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
    const result = await glados();
    if (result && Number(result[2].split(' ')[2]) > 90) {
      await notify(result);
    }
  }
  
  main()
  
