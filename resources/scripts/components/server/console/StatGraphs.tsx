import { useEffect, useRef } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent } from '@server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { Line } from 'react-chartjs-2';
import { useChart, useChartTickLabel } from '@server/console/chart';
import { hexToRgba } from '@/lib/helpers';
import { bytesToString } from '@/lib/formatters';
import { CloudDownloadIcon, CloudUploadIcon } from '@heroicons/react/solid';
import { theme } from 'twin.macro';
import ChartBlock from '@server/console/ChartBlock';
import Tooltip from '@/elements/tooltip/Tooltip';
import { useStoreState } from '@/state/hooks';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation();
    const { primary } = useStoreState(state => state.theme.data!.colors);
    const status = ServerContext.useStoreState(state => state.status.value);
    const limits = ServerContext.useStoreState(state => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });

    const cpu = useChartTickLabel(t('console.chart_block.cpu'), limits.cpu, '%', 0);
    const memory = useChartTickLabel(t('console.chart_block.memory'), limits.memory, 'MiB');
    const network = useChart(t('console.chart_block.network'), {
        sets: 2,
        options: {
            scales: {
                y: {
                    ticks: {
                        callback(value) {
                            return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value);
                        },
                    },
                },
            },
        },
                callback(opts, index) {
                    return {
                        ...opts,
                        label: !index ? t('console.chart_block.inbound') : t('console.chart_block.outbound'),
                borderColor: !index ? theme('colors.cyan.400') : primary,
                backgroundColor: hexToRgba(!index ? theme('colors.cyan.700') : primary, 0.5),
            };
        },
    });

    useEffect(() => {
        if (status === 'offline') {
            cpu.clear();
            memory.clear();
            network.clear();
        }
    }, [status]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        let values: any = {};
        try {
            values = JSON.parse(data);
        } catch (e) {
            return;
        }
        cpu.push(values.cpu_absolute);
        memory.push(Math.floor(values.memory_bytes / 1024 / 1024));
        network.push([
            previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx),
            previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx),
        ]);

        previous.current = { tx: values.network.tx_bytes, rx: values.network.rx_bytes };
    });

    return (
        <>
            <ChartBlock title={t('console.chart_block.cpu')}>
                <Line {...cpu.props} />
            </ChartBlock>
            <ChartBlock title={t('console.chart_block.memory')}>
                <Line {...memory.props} />
            </ChartBlock>
            <ChartBlock
                title={t('console.chart_block.network')}
                legend={
                    <>
                        <Tooltip arrow content={t('console.chart_block.inbound')}>
                            <CloudDownloadIcon className={'mr-2 h-4 w-4 text-green-400'} />
                        </Tooltip>
                        <Tooltip arrow content={t('console.chart_block.outbound')}>
                            <CloudUploadIcon className={'h-4 w-4 text-cyan-400'} />
                        </Tooltip>
                    </>
                }
            >
                <Line {...network.props} />
            </ChartBlock>
        </>
    );
};
