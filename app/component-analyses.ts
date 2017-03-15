import { ApiLocator } from './index';

export class ComponentAnalyses {

    private stackApiUrl: string;
    private api: ApiLocator = new ApiLocator();

    constructor() {
        this.stackApiUrl = this
            .api
            .buildApiUrl(STACK_API_URL, 'api', 'api');
    }

    buildComponentGrid = (dataSet: Array<any>) => {
        for (var i in dataSet) {
            var strToAdd = '<tr>' +
                '<td>' + dataSet[i].ecosystem + '</td>' +
                '<td>' + dataSet[i].name + '</td>' +
                '<td>' + dataSet[i].cyclomaticComplexity + '</td>' +
                '<td>' + dataSet[i].lineOfCode + '</td>' +
                '<td>' + dataSet[i].numOfFiles + '</td>' +
                '<td>' + dataSet[i].dependentsCount + '</td>' +
                '<td>' + dataSet[i].currentVersion + '</td>' +
                '<td>' + dataSet[i].latestVersion + '</td></tr>';
            $('#compTable tbody').append(strToAdd);
        }
    }

    formStackData = (compAnalysesArray: any) => {
        if (compAnalysesArray.length) {
            let dataSet: Array<any> = [];
            for (let i in compAnalysesArray) {
                let dataSetObj: any = {};
                dataSetObj.ecosystem = compAnalysesArray[i].version.pecosystem[0];
                dataSetObj.name = compAnalysesArray[i].version.pname[0];
                dataSetObj.cyclomaticComplexity = compAnalysesArray[i].version.cm_avg_cyclomatic_complexity[0];
                dataSetObj.lineOfCode = compAnalysesArray[i].version.cm_loc[0];
                dataSetObj.numOfFiles = compAnalysesArray[i].version.cm_num_files[0];
                dataSetObj.dependentsCount = compAnalysesArray[i].version.dependents_count[0];
                dataSetObj.currentVersion = compAnalysesArray[i].version.version[0];
                dataSetObj.latestVersion = compAnalysesArray[i].package.latest_version[0];
                dataSet.push(dataSetObj);
            }
            this.buildComponentGrid(dataSet);
        }
    }

    buildComponentAnalyses = () => {
        let stackUri = this.stackApiUrl;
        let compAnalysesArray: Array<any>;
        let ecosystem: string = '';
        let component: string = '';
        let version: string = '';
        $('#compGridCntr').hide();
        $('#componentStatus').hide();
        $("#componentanalysesform").submit((val: any) => {
            ecosystem = $("#ecosystem").val();
            component = $("#component").val();
            version = $("#version").val();
            $.ajax({
                url: stackUri + 'component-analyses/' + ecosystem + '/' + component + '/' + version,
                headers: {
                    'Content-Type': "application/json"
                },
                method: 'GET',
                success: response => {
                    if (response && response.result && response.result.result && response.result.result.data.length > 0) {
                        compAnalysesArray = response.result.result.data;
                        $('#compGridCntr').show();
                        $('#componentStatus').hide();
                        this.formStackData(compAnalysesArray);
                    } else {
                        $('#compGridCntr').hide();
                        $('#componentStatus').show();
                        $('#componentStatusMsg').text('No records found');
                    }
                },
                error: () => {
                    $('#compGridCntr').hide();
                    $('#componentStatus').show();
                    $('#componentStatusMsg').text('Failed to fetch the records');
                }
            });
            event.preventDefault();
        });
    }

}